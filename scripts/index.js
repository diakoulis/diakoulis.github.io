import { getNumCols, debounce } from './shared.js';

const INDEX_CONFIG = Object.freeze({
   api: { albumsFile: "albums.json", imagesFile: "manifest.json" }
});

const grid = document.getElementById("albumGrid");
let loadedAlbums = [];
let currentCols = 0;

const fetchAlbumData = async () => {
   try {
      const res = await fetch(INDEX_CONFIG.api.albumsFile);
      if (!res.ok) throw new Error(`Failed to load ${INDEX_CONFIG.api.albumsFile}`);
      const albumNames = await res.json();

      const promises = albumNames.map(async (name) => {
         try {
            const albumRes = await fetch(`album/${name}/${INDEX_CONFIG.api.imagesFile}`);
            if (!albumRes.ok)
               return null;

            const data = await albumRes.json();

            const cover = data.cover?.trim();
            const coverSrc = cover ? (cover.startsWith("album/") ? cover : `album/${name}/${cover}`) : (data.images?.[0]?.thumb || "placeholder.jpg");

            return {
               name,
               info: data.albumInfo || {},
               imageSrc: coverSrc
            };
         } catch {
            return null;
         }
      });

      const results = await Promise.all(promises);
      loadedAlbums = results.filter(Boolean);
   } catch (error) {
      console.error("Critical error fetching albums:", error);
   }
};

const renderAlbums = (force = false) => {
   // getNumCols() automatically uses SHARED_CONFIG.cols now
   const numCols = getNumCols();
   if (!force && numCols === currentCols)
      return;

   currentCols = numCols;
   grid.innerHTML = "";

   if (!loadedAlbums.length) {
      grid.innerHTML = "<p>No albums found.</p>";
      return;
   }

   const fragment = document.createDocumentFragment();

   const columns = Array.from({ length: numCols }, () => {
      const col = document.createElement("div");
      col.className = "column";
      fragment.appendChild(col);
      return col;
   });

   loadedAlbums.forEach((album, i) => {
      const card = document.createElement("div");
      card.className = "album";
      card.addEventListener("click", () => window.location.href = `album.html?id=${album.name}`);

      const title = album.info.title || 'Untitled';

      card.innerHTML = `
         <img src="${album.imageSrc}" loading="lazy" alt="${title}" />
         <div class="info">
            <p class="title">${title}</p>
            ${album.info.date ? `<p class="date">${album.info.date}</p>` : ''}
         </div>`;
      columns[i % numCols].appendChild(card);
   });

   grid.appendChild(fragment);
};

const init = async () => {
   await fetchAlbumData();
   renderAlbums(true);
};

init();
window.addEventListener("resize", debounce(() => renderAlbums(false)));