document.addEventListener("DOMContentLoaded", function () {
  const bookId = new URLSearchParams(window.location.search).get("id");
  if (!bookId) {
    console.error("No book ID specified in the URL");
    return;
  }
  document.getElementById("bookId").textContent = `${bookId}`;
  prefillForm(bookId);
});

function prefillForm(bookId) {
  fetch(`http://localhost:8080/api/books/${bookId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("failed to fetch member details");
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("title").value = data.title;
      document.getElementById("author").value = data.author;
      document.getElementById("isbn").value = data.isbn;
      document.getElementById("publisher").value = data.publisher;
      document.getElementById("yearPublished").value = data.yearOfPublication;
      document.getElementById("placePublished").value = data.placeOfPublication;
      document.getElementById("noOfAvailableCopies").value =
        data.noOfAvailableCopies;
      document.getElementById("barcodeNumber").value = data.barcodeNumber;
    })
    .catch((err) => {
      console.error("Unexpected error: " + err);
    });
}

document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();
  const bookId = new URLSearchParams(window.location.search).get("id");
  const formData = {
    title: document.getElementById("title").value,
    author: document.getElementById("author").value,
    isbn: document.getElementById("isbn").value,
    publisher: document.getElementById("publisher").value,
    yearOfPublication: document.getElementById("yearPublished").value,
    placeOfPublication: document.getElementById("placePublished").value,
    noOfAvailableCopies: document.getElementById("noOfAvailableCopies").value,
    barcodeNumber: document.getElementById("barcodeNumber").value,
  };
  updateMemberData(bookId, formData);
});
function updateMemberData(id, data) {
  fetch(`http://localhost:8080/api/books/updateBook/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("failed to fetch patch");
      }
      return response.json();
    })
    .catch((err) => {
      console.error("Unxpected error: " + err);
    });
}
