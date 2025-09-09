if (window.location.pathname.endsWith("index.html")) { 
    title = "Home"
} else {
    title = "Error 404"
}

document.getElementById("page-title").textContent =  title + " | Diakoulis";