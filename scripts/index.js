const albums = [
    { name: "hgemonas" }
];

const grid = document.getElementById("albumGrid");

function renderAlbums() {
    grid.innerHTML = "";

    const numCols = window.innerWidth <= 900 ? 2 : 3;
    const columns = [];

    for (let i = 0; i < numCols; i++) {
        const col = document.createElement("div");
        col.classList.add("column");
        grid.appendChild(col);
        columns.push(col);
    }

    albums.forEach((album, idx) => {
        fetch(`album/${album.name}/images.json`)
            .then(res => res.json())
            .then(data => {
                const albumInfo = data.albumInfo;

                const card = document.createElement("div");
                card.classList.add("album-card");

                card.innerHTML = `
                    <img src="album/${data.images[0]}" alt="${albumInfo.title}" loading="lazy">
                    <div class="album-info">
                        <h2>${albumInfo.title}</h2>
                        <p>${albumInfo.description}</p>
                        <p>${albumInfo.date}</p>
                    </div>
                `;

                card.addEventListener("click", () => {
                    window.location.href = `album/${album.name}.html`;
                });

                columns[idx % numCols].appendChild(card);
            })
            .catch(err => console.error(`Error loading album ${album.name}:`, err));
    });
}

renderAlbums();
window.addEventListener("resize", renderAlbums);