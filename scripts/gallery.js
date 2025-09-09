


const jsonPath = `${albumID}/images.json`

fetch(jsonPath)
    .then(res => res.json())
    .then(data => {
        const albumInfo = data.albumInfo;
        const images = data.images;

        document.getElementById("title").textContent = albumInfo.title;
        document.getElementById("desc").textContent = albumInfo.description;
        document.getElementById("date").textContent = albumInfo.date;
        document.getElementById("page-title").textContent = albumInfo.title + " | Diakoulis";

        const grid = document.querySelector(".grid");
        grid.innerHTML = "";

        let numCols = window.innerWidth <= 900 ? 2 : 3;
        const columns = [];
        for (let i = 0; i < numCols; i++) {
            const col = document.createElement("div");
            col.classList.add("column");
            grid.appendChild(col);
            columns.push(col);
        }

        images.forEach((src, idx) => {
            const img = document.createElement("img");
            img.src = src;
            img.loading = "lazy";
            columns[idx % numCols].appendChild(img);

            img.addEventListener("click", () => {
                const lightbox = document.getElementById("lightbox");
                const lightboxImg = document.getElementById("lightbox-img");
                lightbox.style.display = "flex";
                lightboxImg.src = src;
                document.body.style.overflow = "hidden";
            });
        });

        window.addEventListener("resize", () => {
            grid.innerHTML = "";
            let numCols = window.innerWidth <= 900 ? 2 : 3;
            const columns = [];
            for (let i = 0; i < numCols; i++) {
                const col = document.createElement("div");
                col.classList.add("column");
                grid.appendChild(col);
                columns.push(col);
            }
            images.forEach((src, idx) => {
                const img = document.createElement("img");
                img.src = src;
                img.loading = "lazy";
                columns[idx % numCols].appendChild(img);
                img.addEventListener("click", () => {
                    const lightbox = document.getElementById("lightbox");
                    const lightboxImg = document.getElementById("lightbox-img");
                    lightbox.style.display = "flex";
                    lightboxImg.src = src;
                    document.body.style.overflow = "hidden";
                });
            });
        });
    });

document.querySelector("#lightbox .close").addEventListener("click", () => {
    const lightbox = document.getElementById("lightbox");
    lightbox.style.display = "none";
    document.body.style.overflow = "auto";
});

document.getElementById("lightbox").addEventListener("click", e => {
    if (e.target.id === "lightbox") {
        const lightbox = document.getElementById("lightbox");
        lightbox.style.display = "none";
        document.body.style.overflow = "auto";
    }
});

const backToTop = document.getElementById("backToTop");
backToTop.onclick = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};