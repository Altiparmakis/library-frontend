let bookId = null;
document.addEventListener("DOMContentLoaded", function () {
  bookId = getQueryParam("id");
  if (!bookId) {
    console.error("No book Id specified in the URL");
    return;
  }
  fetch(`http://localhost:8080/api/books/${bookId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      displayBookDetails(data);
      updateLinkVisibility(data.noOfAvailableCopies);
      const checkoutLink = document.getElementById("checkoutLink");
      checkoutLink.href = `book-checkout.html?bookBarcode=${data.barcodeNumber}`;
    })
    .catch((err) => {
      console.error("Error fetching book details", err);
    });
  const currentHoldersLink = document.getElementById("currentHoldersLink");
  currentHoldersLink.addEventListener("click", function (ev) {
    ev.preventDefault();
    fetchCurrentHolders(bookId);
  });
  const removeCopyLink = document.getElementById("removeCopyLink");
  removeCopyLink.addEventListener("click", function () {
    confirmAndRemoveCopy();
  });
  const addCopyLink = document.getElementById("addCopyLink");
  addCopyLink.addEventListener("click", function () {
    addBookCopy();
  });
  const editBookLink = document.getElementById("editBookLink");
  editBookLink.href = `edit-book.html?id=${bookId}`;

  //setup the checkoutHistoryLink
  const checkoutHistoryLink = document.getElementById("checkoutHistoryLink");
  checkoutHistoryLink.addEventListener("click", function (e) {
    e.preventDefault();
    fetchCheckoutHistoryByBookId(bookId);
  });
});
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
function displayBookDetails(book) {
  console.log("Book: ", book);
  document.getElementById(
    "bookTitleAndAuthor"
  ).textContent = ` ${book.title}, ${book.author}`;
  document.getElementById("isbn").textContent = book.isbn;
  document.getElementById("publisher").textContent = book.publisher;
  document.getElementById("yearOfPublication").textContent =
    book.yearOfPublication;
  document.getElementById("placeOfPublication").textContent =
    book.placeOfPublication;
  document.getElementById("availableCopies").textContent =
    book.noOfAvailableCopies;
  //control the visibility of remove link based on noOfAvailableCopies
  const removeCopyLink = document.getElementById("removeCopyLink");
  if (book.noOfAvailableCopies > 0) {
    removeCopyLink.style.display = "";
  } else {
    removeCopyLink.style.display = "none";
  }
}
function updateLinkVisibility(availableCopies) {
  const checkoutLink = document.getElementById("checkoutLink");
  const removeCopyLink = document.getElementById("removeCopyLink");
  if (availableCopies > 0) {
    checkoutLink.style.display = "inline";
    removeCopyLink.style.display = "inline";
  } else {
    checkoutLink.style.display = "none";
    removeCopyLink.style.display = "none";
  }
}
function fetchCurrentHolders(bookId) {
  console.log("Fetching current holders for bookId ", bookId);
  fetch(`http://localhost:8080/api/registers/book/${bookId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("fail to fetch the registers for this book");
      }
      return response.json();
    })
    .then((registers) => {
      console.log("Registers: ", registers);
      const currentHolders = registers.filter(
        (register) => register.returnDate == null
      );
      const memberDetailsPromises = currentHolders.map((register) => {
        return fetch(`http://localhost:8080/api/members/${register.memberId}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch members");
            }
            return response.json();
          })
          .then((member) => ({
            ...member,
            checkoutDate: register.checkoutDate,
            dueDate: register.dueDate,
          }));
      });
      return Promise.all(memberDetailsPromises);
    })
    .then((membersWithDetails) => {
      displayCurrentHolders(membersWithDetails);
    })
    .catch((err) => {
      alert("Error occured");
      console.error(err);
    });
}
function displayCurrentHolders(members) {
  console.log("Displaying members...", members);
  let html = "<p>No current holders</p>";
  if (members.length > 0) {
    html = `
        <h2 class="h2-no-line">Current holders</h2>
        <table class="results-table">
          <tr><th>First name</th><th>Last name</th><th>Card #</th><th>Checkout Date</th><th>Due Date</th></tr>

    `;
  }
  members.forEach((member) => {
    const checkoutDate = new Date(member.checkoutDate).toLocaleDateString();
    const dueDate = new Date(member.dueDate).toLocaleDateString();
    html += `
      <tr>
        <td>${member.firstName}</td>
        <td>${member.lastName}</td>
        <td>${member.id}</td>
        <td>${checkoutDate}</td>
        <td>${dueDate}</td>
      </tr>
      `;
  });
  if (members.length > 0) {
    html += `</table>`;
  }
  const currentHoldersContainer = document.getElementById(
    "currentHoldersContainer"
  );
  currentHoldersContainer.innerHTML = html;
}

function removeBookCopy() {
  updateBookCopies(-1);
}
function addBookCopy() {
  updateBookCopies(1);
}
function confirmAndRemoveCopy() {
  if (confirm("Are you sure you want to remove a copy?")) {
    removeBookCopy();
  }
}
function updateBookCopies(incr) {
  fetch(`http://localhost:8080/api/books/${bookId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch book");
      }
      return response.json();
    })
    .then((book) => {
      const payload = book.noOfAvailableCopies + incr;
      return fetch(`http://localhost:8080/api/books/updateBook/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noOfAvailableCopies: payload }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("failed to patch");
          }
          return response.json();
        })
        .then(() => {
          location.reload();
        })
        .catch((error) => {
          console.error(error);
        });
    });
}
function fetchCheckoutHistoryByBookId(bookId) {
  fetch(`http://localhost:8080/api/registers/book/${bookId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("failed to fetch registers");
      }
      return response.json();
    })
    .then((registers) => {
      console.log("Registers: ", registers);
      const returndRegisters = registers.filter(
        (register) => register.returnDate != null
      );
      console.log("Filtered Registers: ", returndRegisters);
      const memberDetailsPromises = returndRegisters.map((register) => {
        return fetch(`http://localhost:8080/api/members/${register.memberId}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("failed to fetch member details");
            }
            return response.json();
          })
          .then((member) => ({
            ...member,
            checkoutDate: register.checkoutDate,
            dueDate: register.dueDate,
            returnDate: register.returnDate,
            overdueFine: register.overdueFine,
          }));
      });
      return Promise.all(memberDetailsPromises);
    })
    .then((membersWithDetails) => {
      console.log("membersWithDetails: ", membersWithDetails);
      displayCheckoutHistory(membersWithDetails);
    })
    .catch((err) => {
      console.error("Unexpected error", err);
    });
}
function displayCheckoutHistory(members) {
  let html = "";
  const checkoutHistoryContainer = document.getElementById(
    "checkoutHistoryContainer"
  );
  checkoutHistoryContainer.innerHTML = "";
  if (members.length === 0) {
    checkoutHistoryContainer.innerHTML = "<p>No checkout history</p>";
    return;
  }
  html = `
    <h2>Checkout History</h2>
    <table class="results-table"> 
      <tr><th>First Name</th><th>Last Name</th><th>Card No</th><th>Checkout Date</th><th>Due Date</th><th>Return Date</th><th>Overdue Fine</th></tr>

  `;
  members.forEach(member => {
    const checkoutDate = new Date(member.checkoutDate).toLocaleDateString(); 
    const dueDate = new Date(member.dueDate).toLocaleDateString(); 
    const returnDate = new Date(member.returnDate).toLocaleDateString();
    const overdueFine = member.overdueFine ? `${parseFloat(member.overdueFine).toFixed(2)} USD` : "";
    html += `
      <tr>
        <td>${member.firstName}</td>
        <td>${member.lastName}</td>
        <td>${member.id}</td>
        <td>${checkoutDate}</td>
        <td>${dueDate}</td>
        <td>${returnDate}</td>
        <td>${overdueFine}</td>
      </tr>
    `;
  })

  html += `</table>`;
  checkoutHistoryContainer.innerHTML = html;
}
