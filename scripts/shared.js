export const SHARED_CONFIG = Object.freeze({
   breakpoints: { mobile: 600, tablet: 1024 },
   cols: { desktop: 4, tablet: 3, mobile: 1 },
   debounceDelay: 150
});

export const getNumCols = (colsConfig = SHARED_CONFIG.cols) => {
   const w = window.innerWidth;
   if (w <= SHARED_CONFIG.breakpoints.mobile) return colsConfig.mobile;
   if (w <= SHARED_CONFIG.breakpoints.tablet && colsConfig.tablet) return colsConfig.tablet;
   return colsConfig.desktop;
};

export const debounce = (func, delay = SHARED_CONFIG.debounceDelay) => {
   let timeoutId;
   return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
   };
};