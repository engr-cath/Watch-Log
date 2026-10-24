const startingDramas = 
[{
  title: "Crash Landing on You",
  rating: 5, 
  genres: "Romance",
  episodes : 16,
  review: "Write your revierw here.",
  status: "finished",
  country: "Korean",
  poster: "https://via.placeholder.com/200x300",
  year: 2019,
},
{
  title: "Spooky in Love",
  rating: 5, 
  genres: "Comedy",
  episodes : 16,
  review: "Write your revierw here.",
  status: "ongoing",
  country: "Korean",
  poster: "https://via.placeholder.com/200x300",
  year: 2019,
},
  {
  title: "911",
  rating: 2, 
  genres: "Thriller",
  episodes : 16,
  review: "Write your revierw here.",
  status: "towatch",
  country: "Korean",
  poster: "https://via.placeholder.com/200x300",
  year: 2019,
}];

let dramas =startingDramas;
const saved = localStorage.getItem("dramas");

if (saved) {
  dramas = JSON.parse(saved);
}

function saveDramas() {
  localStorage.setItem("dramas", JSON.stringify(dramas));
}

function makeCard(drama)
{
  return `
    <div class="card">
      <img src="${drama.poster}" alt="${drama.title}">
      <h2>${drama.title} (${drama.year})</h2>
      <p class="stars">${"★".repeat(drama.rating)}</p>
      <p>${drama.genres}</p>
      <p>Episodes: ${drama.episodes}</p>
      <details>
        <summary>My Review</summary>
        <p>${drama.review}</p>
      </details>
    </div>
  `;
}

const row = document.querySelector("#home-row");

function fillRow(rowId, status) {
  const target = document.querySelector("#" + rowId);

dramas
  .filter(function (drama) {
    return drama.status === status;
  })
  .forEach(function (drama) {
    target.innerHTML += makeCard(drama);
  });
}

  const genreList = ["Romance", "Comedy", "Thriller"];
  const countryList = ["Korean", "Japanese", "Chinese", "Thai", "Filipino", "Anime", "English"];
  
  function renderByGenre(containerId, status) {
    const container = document.querySelector("#" + containerId);
      container.innerHTML = "";
      
      genreList.forEach(function (genre) {
        let html = "";
        
        countryList.forEach(function (country) {
          const matches = dramas.filter(function (drama) {
            return drama.status === status &&
                   drama.genres.includes(genre) &&
                   drama.country === country;
          });
          
          if (matches.length === 0)return;
          
          html += `<h3>${country}</h3><div class="row">`;
          matches.forEach(function (drama) {
            html += makeCard(drama);
          });
          html += `</div>`
        });
        
        if (html === "") return;
        
        container.innerHTML += `<section class="genre"><h1>${genre}</h1>${html}</section>`;
      });
  }
  
  function renderAll() {
    row.innerHTML ="";
    
    dramas.forEach(function (drama) {
      row.innerHTML += makeCard(drama);
    });
    
    renderByGenre("finished-list", "finished");
    renderByGenre("ongoing-list", "ongoing"); 
    renderByGenre("towatch-list", "towatch");
  }
  
  renderAll();
  
  const links = document.querySelectorAll(".sidebar a");
  const pages = document.querySelectorAll(".page");
  
  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      if (!link.dataset.page) return;
      
      pages.forEach(function (page)  {
        page.hidden = true;
      });
      document.querySelector("#" + link.dataset.page).hidden = false;
    });
  });
  
  const searchBox = document.querySelector(".search");
  
  searchBox.addEventListener("input", function () {
    const text = searchBox.value.toLowerCase();
    
    row.innerHTML = "";
    
    dramas
      .filter(function (drama) {
        return drama.title.toLowerCase().includes(text) || drama.genres.toLowerCase().includes(text);
      })
      .forEach(function (drama) {
        row.innerHTML += makeCard(drama);
      });
  });
  
  const addForm = document.querySelector("#add-form");
  
  addForm.addEventListener("submit", function (event) {
    event.preventDefault();
    
    const newDrama = {
      title: document.querySelector("#f-title").value,
      poster: document.querySelector("#f-poster").value || "https://via.placeholder.com/200x300",
      year: Number(document.querySelector("#f-year").value),
      episodes: Number(document.querySelector("#f-episodes").value),
      genres: document.querySelector("#f-genres").value,
      country: document.querySelector("#f-country").value,
      status: document.querySelector("#f-status").value,
      rating: Number(document.querySelector("#f-rating").value),
      review: document.querySelector("#f-review").value
    };
    
    dramas.push(newDrama);
    renderAll();
    addForm.reset();
    
    dramas.push(newDrama);
    saveDramas();
    renderAll();
  });
