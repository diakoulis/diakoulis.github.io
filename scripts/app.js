const CONFIG = {
   api: { albumsFile: "albums.json", imagesFile: "manifest.json" },
   breakpoints: { mobile: 768, tablet: 1200 },
   cols: { desktop: 4, tablet: 3, mobile: 1 },
   debounceDelay: 150,
   load: { initial: 12, step: 12, threshold: 4 }
};

const state = {
   view: 'index',
   albumId: null,
   currentCols: 0,
   albumsData: [],
   imageSet: [],
   visibleItems: 0
};

const DOM = {
   pageTitle: document.getElementById("title"),
   infoText: document.getElementById("description"),
   dateText: document.getElementById("date"),
   galleryGrid: document.getElementById("grid"),
   showMoreBtn: document.getElementById("show-more-btn"),

   lightbox: {
      overlay: document.getElementById("lightbox"),
      image: document.getElementById("lightbox-img"),
      title: document.getElementById("lightbox-title"),
      date: document.getElementById("lightbox-date"),
      prevBtn: document.getElementById("lightbox-prev-btn"),
      nextBtn: document.getElementById("lightbox-next-btn"),
      closeBtn: document.getElementById("lightbox-close-btn"),
      shareBtn: document.getElementById("lightbox-share-btn")
   }
};

const getNumCols = () => {
   const w = window.innerWidth;
   if (w <= CONFIG.breakpoints.mobile)
      return CONFIG.cols.mobile;
   if (w <= CONFIG.breakpoints.tablet)
      return CONFIG.cols.tablet;
   return CONFIG.cols.desktop;
};

const debounce = (func, delay = CONFIG.debounceDelay) => {
   let timeoutId;
   return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
   };
};

class LightboxManager {
   constructor(imageSet) {
      this.imageSet = imageSet;
      this.currentIndex = 0;
      this.bindEvents();
   }

   bindEvents() {
      DOM.lightbox.overlay?.addEventListener("click", (e) => {
         const clickedClose = e.target.closest('#lightbox-close-btn');
         const clickedNext = e.target.closest('#lightbox-next-btn');
         const clickedPrev = e.target.closest('#lightbox-prev-btn');
         const clickedShare = e.target.closest('#lightbox-share-btn');
         const clickedOverlay = (e.target === DOM.lightbox.overlay);

         if (clickedClose || clickedOverlay)
            this.close();
         else if (clickedNext)
            this.next();
         else if (clickedPrev)
            this.prev();
         else if (clickedShare)
            this.share();
      });

      document.addEventListener("keydown", (e) => {
         if (DOM.lightbox.overlay?.style.display !== "flex")
            return;

         if (e.key === "Escape")
            this.close();
         else if (e.key === "ArrowRight")
            this.next();
         else if (e.key === "ArrowLeft")
            this.prev();
      });
   }

   async share() {
      const currentImage = this.imageSet[this.currentIndex];

      const absoluteUrl = new URL(currentImage.full, window.location.href).href;

      if (navigator.share) {
         try {
            await navigator.share({
               title: document.title,
               url: absoluteUrl
            });
         } catch (error) { }
      } else {
         try {
            await navigator.clipboard.writeText(absoluteUrl);
            alert("Image link copied to clipboard!");
         } catch (error) {
            alert("Failed to copy link.");
         }
      }
   }

   open(index) {
      if (!DOM.lightbox.overlay || !DOM.lightbox.image) {
         return;
      }

      this.currentIndex = parseInt(index, 10);
      const currentImage = this.imageSet[this.currentIndex];

      DOM.lightbox.image.alt = `Image ${this.currentIndex + 1}`;
      DOM.lightbox.image.style.visibility = "hidden";

      if (DOM.lightbox.prevBtn) {
         if (this.currentIndex === 0)
            DOM.lightbox.prevBtn.classList.add('disabled');
         else
            DOM.lightbox.prevBtn.classList.remove('disabled');
      }

      if (DOM.lightbox.nextBtn) {
         if (this.currentIndex === (this.imageSet.length - 1))
            DOM.lightbox.nextBtn.classList.add('disabled');
         else
            DOM.lightbox.nextBtn.classList.remove('disabled');
      }

      DOM.lightbox.image.src = currentImage.full;
      DOM.lightbox.image.style.visibility = "visible";
      DOM.lightbox.overlay.style.display = "flex";
      document.body.style.overflow = "hidden";

      if (this.currentIndex < this.imageSet.length - 1) {
         new Image().src = this.imageSet[this.currentIndex + 1].full;
      }
   }

   close() {
      if (DOM.lightbox.overlay)
         DOM.lightbox.overlay.style.display = "none";
      document.body.style.overflow = "";
   }

   next() {
      if (this.currentIndex < (this.imageSet.length - 1))
         this.open(this.currentIndex + 1);
   }

   prev() {
      if (this.currentIndex > 0)
         this.open(this.currentIndex - 1);
   }
}

const GalleryApp = {
   lightboxInstance: null,

   updatePageMeta(title, description, date) {
      const pageTitle = title ? title : "Untitled";

      if (state.view === 'index')
         document.title = "Diakoulis | Home";
      else
         document.title = `${pageTitle} | Gallery`;

      if (DOM.pageTitle)
         DOM.pageTitle.textContent = pageTitle;

      if (DOM.infoText) {
         DOM.infoText.textContent = description;
         DOM.infoText.style.display = description ? "" : "none";
      }

      if (DOM.dateText) {
         DOM.dateText.textContent = date;
         DOM.dateText.style.display = date ? "" : "none";
      }

      if (DOM.lightbox.title)
         DOM.lightbox.title.textContent = pageTitle;
      if (DOM.lightbox.date)
         DOM.lightbox.date.textContent = date;
   },

   async loadIndex() {
      this.updatePageMeta("Gallery", "", "");

      try {
         const res = await fetch(CONFIG.api.albumsFile);
         if (!res.ok) throw new Error("Failed to load albums");

         state.albumsData = await res.json();
         state.visibleItems = Math.min(CONFIG.load.initial, state.albumsData.length);
         this.renderGrid(true);
      } catch (error) {
         if (DOM.galleryGrid) DOM.galleryGrid.innerHTML = `<p class="error">Error loading gallery.</p>`;
      }
   },

   async loadAlbum() {
      try {
         const res = await fetch(`album/${state.albumId}/${CONFIG.api.imagesFile}`);
         if (!res.ok) throw new Error("Failed to load album");

         const data = await res.json();

         state.imageSet = data.images.map(img => ({ ...img }));
         state.visibleItems = Math.min(CONFIG.load.initial, state.imageSet.length);

         this.updatePageMeta(data.meta.title, data.meta.description, data.meta.date);
         this.lightboxInstance = new LightboxManager(state.imageSet);
         this.renderGrid(true);
      } catch (error) {
         if (DOM.galleryGrid) DOM.galleryGrid.innerHTML = `<p class="error">Error loading album data.</p>`;
      }
   },

   renderGrid(force = false) {
      if (!DOM.galleryGrid)
         return;

      const numCols = getNumCols();
      if (!force && numCols === state.currentCols)
         return;

      state.currentCols = numCols;
      DOM.galleryGrid.innerHTML = "";

      const items = state.view === 'index' ? state.albumsData : state.imageSet;

      if (items.length === 0) {
         DOM.galleryGrid.innerHTML = "<p>Nothing to show.</p>";
         if (DOM.showMoreBtn)
            DOM.showMoreBtn.style.display = "none";
         return;
      }

      const fragment = document.createDocumentFragment();
      const columns = Array.from({ length: numCols }, () => {
         const col = document.createElement("div");
         col.className = "column";
         fragment.appendChild(col);
         return col;
      });

      items.slice(0, state.visibleItems).forEach((item, i) => {
         const element = document.createElement(state.view === 'index' ? "div" : "img");

         if (state.view === 'index') {
            element.className = "album";
            element.innerHTML = `
               <img src="${item.cover}" loading="lazy" alt="${item.title}" />
               <h3 class="title">${item.title}</h3>
               ${item.date ? `<p class="date">${item.date}</p>` : ''}
            `;
            element.addEventListener("click", () => window.location.href = `?album=${item.id}`);
         } else {
            element.src = item.thumb;

            if (i < numCols) {
               element.loading = "eager";
               element.fetchPriority = "high";
            } else {
               element.loading = "lazy";
            }

            element.dataset.index = i;
         }

         columns[i % numCols].appendChild(element);
      });

      DOM.galleryGrid.appendChild(fragment);

      if (DOM.showMoreBtn)
         DOM.showMoreBtn.style.display = state.visibleItems < items.length ? "block" : "none";
   },

   init() {
      DOM.galleryGrid?.addEventListener("click", (e) => {
         if (state.view === 'album' && e.target.tagName === "IMG" && this.lightboxInstance)
            this.lightboxInstance.open(e.target.dataset.index);
      });

      DOM.showMoreBtn?.addEventListener('click', () => {
         DOM.showMoreBtn.blur();

         const total = state.view === 'index' ? state.albumsData.length : state.imageSet.length;
         const nextTarget = state.visibleItems + CONFIG.load.step;

         state.visibleItems = (total - nextTarget <= CONFIG.load.threshold) ? total : Math.min(nextTarget, total);
         this.renderGrid(true);
      });

      window.addEventListener("resize", debounce(() => this.renderGrid(false)));

      const params = new URLSearchParams(window.location.search);
      state.albumId = params.get("album");

      if (state.albumId) {
         state.view = 'album';
         this.loadAlbum();
      } else {
         state.view = 'index';
         this.loadIndex();
      }
   }
};

GalleryApp.init();