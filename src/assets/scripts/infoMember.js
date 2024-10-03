let memberId = null;
document.addEventListener("DOMContentLoaded", function () {
  memberId = getQueryParam("id");
  if (!memberId) {
    console.error("No member id specified in the URL");
    return;
  }
  const url = `http://localhost:8080/api/members/${memberId}`;
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network error");
      }
      return response.json();
    })
    .then((data) => {
      displayMemberDetails(data);
      fetchCheckoutBooks(data.id);
    })
    .catch((error) => {
      console.error("An error occured: ", error);
      alert("An error occured");
    });
    const memberHistoryLink = document.querySelector('a[href="member-history.html"]');
    if(memberHistoryLink) memberHistoryLink.href = `member-history.html?id=${memberId}`;

    const editMemberLink = document.querySelector('a[href="edit-member.html"]');
    if(editMemberLink) editMemberLink.href = `edit-member.html?id=${memberId}`;
});

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
function displayMemberDetails(member) {
  document.getElementById(
    "memberFullName"
  ).textContent = ` ${member.firstName} ${member.lastName}`;
  document.getElementById("cardNumber").textContent = member.id;
  let memberInfo = "";
  let address = `N/A`;
  if (member.address) {
    if (memberInfo) memberInfo = `(member.address.additionalInfo)`;
    address = `${member.address.streetNumber} ${member.address.streetName} ${member.address.zipCode} ${member.address.placeName} ${member.address.country} ${memberInfo}`;
  }
  document.getElementById("address").textContent = address;
  document.getElementById("phone").textContent = member.phone;
  document.getElementById("email").textContent = member.email;
  let dob = new Date(member.dateOfBirth).toLocaleDateString("en-GB");
  document.getElementById("dob").textContent = dob;
  let ms = new Date(member.memberShipStarted).toLocaleDateString("en-GB");
  document.getElementById("membershipStarted").textContent = ms;
  let me = member.memberShipEnded
    ? new Date(member.memberShipEnded).toLocaleDateString("en-GB")
    : "--";
  document.getElementById("membershipEnded").textContent = me;
  document.getElementById("membershipStatus").textContent = member.isActive
    ? "Active"
    : "Terminated";

  //dynamically set the "Terminate" or "Activate Membership" link
  const membershipActionLink = document.getElementById("memebershipActionLink");
  if (member.isActive) {
    membershipActionLink.textContent = "Terminate Membership";
    membershipActionLink.href = "javascript:terminateMembership()";
  } else {
    membershipActionLink.textContent = "Activate Membership";
    membershipActionLink.href = "javascript:activateMembership()";
  }

  //control the visibility of the checkout link based on member's active status
  const checkoutLink = document.getElementById('checkoutLink');
  if(member.isActive){
    checkoutLink.style.display = "inline";
    checkoutLink.href = `book-checkout.html?memberBarcode=${member.barcodeNumber}`;
  }else{
    checkoutLink.style.display = "none";
  }
}
function fetchCheckoutBooks(memberId) {
  fetch(`http://localhost:8080/api/registers/member/${memberId}`)
    .then((response) => {
      if (!response.ok) {
        console.error("Network error: " + response);
        throw new Error("Network respone was not OK");
      }
      return response.json();
    })
    .then((data) => {
      if (data.length === 0) {
        displayCheckoutBooks([]);
        return;
      }
      const bookDetailPromise = data
        .filter((data) => data.returnDate === null)
        .map((data) =>
          fetch(`http://localhost:8080/api/books/${data.bookId}`)
            .then((response) => {
              if (!response.ok) {
                throw new Error("Network error: " + response);
              }
              return response.json();
            })
            .then((bookDetails) => ({
              ...bookDetails,
              dueDate: data.dueDate,
              registerId: data.id,
            }))
            .catch((error) => {
              console.error("An error occurred with fetching book");
              alert("An error occurred");
            })
        );
      Promise.all(bookDetailPromise).then((bookDetails) => {
        displayCheckoutBooks(bookDetails);
      });
    })
    .catch((error) => {
      console.error("An error occured with fetching register", error);
      alert("An error occured");
    });
}

function displayCheckoutBooks(books) {
  console.log("books to display: ", books);
  const booksHeading = document.getElementById("checkedOutBooksHeading");
  const booksTable = document.getElementById("checkedOutBooks");

  booksTable.innerHTML = "";
  if (books.length === 0 || !books) {
    booksHeading.style.display = "none";
    return;
  }
  let tbody = document.createElement("tbody");
  booksTable.appendChild(tbody);

  books.forEach((book, index) => {
    let row = tbody.insertRow();
    let detailCell = row.insertCell(0);
    let actionCell = row.insertCell(1);
    detailCell.innerHTML = `${index + 1}. ${book.title}, ${
      book.author
    } (Due date: ${book.dueDate})`;

    let space = document.createTextNode("\u00A0\u00A0\u00A0\u00A0");
    actionCell.appendChild(space);
    let returnLink = document.createElement("a");
    returnLink.href = "javascript:void(0)";
    returnLink.className = 'action-btn';
    returnLink.textContent = "Return this book";
    returnLink.onclick = function () {
      returnBook(book.registerId, book.title, book.author);
    };
    actionCell.appendChild(returnLink);
  });
}

function returnBook(registerId, bookTitle, bookAuthor) {
  const payload = {
    returnDate: new Date().toISOString().split("T")[0],
  };
  console.log("payload: ", payload);
  fetch(`http://localhost:8080/api/registers/updateRegister/${registerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Networking error");
      }
      return response.json();
    })
    .then(async () => {
      const response = await fetch(
        `http://localhost:8080/api/registers/${registerId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch updated register details");
      }
      return response.json();
    })
    .then((data) => {
      increaseBookCopies(data.bookId);
      return data;
    })
    .then((data) => {
      let alertMessage = `Book "${bookTitle}, ${bookAuthor}" succesfully returned`;
      if (data.overdueFine != null) {
        let formattedFine = parseFloat(data.overdueFine).toFixed(2);
        alertMessage += `\n\nOverdue Fine: ${formattedFine} USD.`;
      }
      alert(alertMessage);
      fetchCheckoutBooks(memberId);
    })
    .catch((error) => {
      alert("faile to fetch the patch");
      console.error("An error occured", error);
    });
  return;
}

function increaseBookCopies(bookId) {
  fetch(`http://localhost:8080/api/books/${bookId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch book details.");
      }
      return response.json();
    })
    .then((data) => {
      const updatedCopies = data.noOfAvailableCopies + 1;
      console.log(
        "Number of available copies before " + data.noOfAvailableCopies
      );
      return fetch(`http://localhost:8080/api/books/updateBook/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noOfAvailableCopies: updatedCopies }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to update book copies.");
          }
          return response.json();
        })
        .catch((error) => {
          console.error("An error occured", error);
          alert("An error occured");
        });
    });
}

function terminateMembership() {
  updateMembershipStatus(false);
}
function activateMembership() {
  updateMembershipStatus(true);
}
function updateMembershipStatus(isActive) {
  const today = new Date().toISOString().split("T")[0];
  const payload = isActive
    ? { memberShipEnded: "" }
    : { memberShipEnded: today };
  console.log("payload: ", payload);
  fetch(`http://localhost:8080/api/members/updateMember/${memberId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed fetch");
      }
      return response.json();
    })
    .then((data) => {
      alert("Succesfull change the status");
      location.reload();
    })
    .catch((err) => {
      console.error("Error : ", err);
    });
}
