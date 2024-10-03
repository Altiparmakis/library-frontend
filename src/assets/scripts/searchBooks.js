document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const barcodeNumber = document.getElementById("barcodeNumber").value;
    const isbn = document.getElementById("isbn").value;
    const author = document.getElementById("author").value;
    const title = document.getElementById("title").value;

    const url = `http://localhost:8080/api/books/search?title=${encodeURIComponent(
      title
    )}&author=${encodeURIComponent(author)}&isbn=${encodeURIComponent(
      isbn
    )}&barcodeNumber=${encodeURIComponent(barcodeNumber)}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok ");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Search result:", data);
        displayResults(data);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        alert("An error occured.");
      });
  });
});

function displayResults(data) {
  let html =
    "<table class='results-table'><tr><th>Title</th><th>Author</th><th>Available copies</th><th></th></tr>";
  data.forEach((book) => {
    html += `<tr>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.noOfAvailableCopies}</td>
                    <td><a class='action-btn' href="book-info.html?id=${book.id}">View Details</a></td>
                </tr>`;
  });
  html += "</table>";
  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.innerHTML = html;
}
