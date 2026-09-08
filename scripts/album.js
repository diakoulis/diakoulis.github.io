import { getNumCols, debounce } from './shared.js';

const ALBUM_CONFIG = Object.freeze({
   load: { initial: 12, step: 10, threshold: 4 }
});

const params = new URLSearchParams(window.location.search);
const albumId = params.get("id");

const grid = document.getElementById("imageGrid");
const showMoreBtn = document.getElementById("show-more-btn");

let imageSet = [];
let currentCols = 0;
let visibleImages = 0;

const appendImagesRange = (startIndex, endIndex, domColumns) => {
   const columnFragments = Array.from({ length: currentCols }, () => document.createDocumentFragment());

   for (let i = startIndex; i < endIndex; i++) {
      const { thumb, description } = imageSet[i];
      const img = document.createElement("img");

      img.src = thumb;
      img.loading = "lazy";
      img.alt = description || `Image ${i + 1}`;
      img.dataset.index = i;

      columnFragments[i % currentCols].appendChild(img);
   }

   domColumns.forEach((col, i) => col.appendChild(columnFragments[i]));
};

const renderGrid = (force = false) => {
   const numCols = getNumCols();
   if (!force && numCols === currentCols) return;

   currentCols = numCols;
   grid.innerHTML = "";

   if (!imageSet.length) {
      grid.innerHTML = "<p>No images found.</p>";
      showMoreBtn.style.display = "none";
      return;
   }

   const fragment = document.createDocumentFragment();
   const columns = Array.from({ length: numCols }, () => {
      const col = document.createElement("div");
      col.className = "column";
      fragment.appendChild(col);
      return col;
   });

   appendImagesRange(0, visibleImages, columns);
   
   grid.appendChild(fragment);

   showMoreBtn.style.display = (visibleImages < imageSet.length) ? "block" : "none";
};

showMoreBtn.addEventListener('click', () => {
   showMoreBtn.blur();
   const oldVisible = visibleImages;
   let nextTarget = visibleImages === ALBUM_CONFIG.load.initial ? 20 : visibleImages + ALBUM_CONFIG.load.step;

   visibleImages = (imageSet.length - nextTarget <= ALBUM_CONFIG.load.threshold) ? imageSet.length : Math.min(nextTarget, imageSet.length);

   const domColumns = grid.querySelectorAll('.column');
   appendImagesRange(oldVisible, visibleImages, domColumns);

   if (visibleImages >= imageSet.length)
      showMoreBtn.style.display = "none";
});

const initAlbum = async () => {
   try {
      const res = await fetch(`album/${albumId}/manifest.json`);
      if (!res.ok) throw new Error("Failed to load album data");

      const { albumInfo: info = {}, images = [] } = await res.json();

      imageSet = images.map(img => ({
         thumb: img.thumb,
         full: img.full,
         description: img.description || ""
      }));

      visibleImages = Math.min(ALBUM_CONFIG.load.initial, imageSet.length);

      const title = info.title || "Untitled Album";
      document.title = `${title} | Diakoulis`;

      document.getElementById("album-title").textContent = title;
      document.getElementById("album-description").textContent = info.description || "";
      document.getElementById("album-date").textContent = info.date || "";

      renderGrid(true);
   } catch (err) {
      grid.innerHTML = `<p class="error">Error loading album data.</p>`;
   }
};

initAlbum();
window.addEventListener("resize", debounce(() => renderGrid(false)));