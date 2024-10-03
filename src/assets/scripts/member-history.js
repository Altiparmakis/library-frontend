let memberId = null;
document.addEventListener("DOMContentLoaded", function () {
  memberId = new URLSearchParams(window.location.search).get("id");
  if (!memberId) {
    console.error("No member id specified");
    return;
  }
  fetch(`http://localhost:8080/api/members/${memberId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch member ");
      }
      return response.json();
    })
    .then((member) => {
      document.getElementById(
        "memberFullName"
      ).textContent = `${member.firstName} ${member.lastName}`;
    })
    .catch((error) => {
      console.error("Failed to fetch member ");
    });
  fetchMemberHistory(memberId);
});
function fetchMemberHistory(memberId) {
  fetch(`http://localhost:8080/api/registers/member/${memberId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch member history");
      }
      return response.json();
    })
    .then((registers) => {
      console.log("Fetched registers: ", registers);
      const historyRegisters = registers.filter(
        (register) => register.returnDate != null
      );
      console.log("filtered registers(with return Date): ", historyRegisters);
      const returnedBooksPromises = historyRegisters.map((register) => {
        return fetch(`http://localhost:8080/api/books/${register.bookId}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch member history");
            }
            return response.json();
          })
          .then((book) => ({
            ...register,
            bookTitle: book.title,
            bookAuthor: book.author,
          }));
      });
      return Promise.all(returnedBooksPromises);
    })
    .then((returnedBooks) => {
      console.log("Returned books: ", returnedBooks);
      displayMemberHistory(returnedBooks);
    })
    .catch((err) => {
      alert("Unexpected error");
      console.error("Unexpected error", err);
    });
}
function displayMemberHistory(books) {
  const historyTable = document.getElementById("historyTable");
  historyTable.innerHTML = "";
  if (books.length === 0) {
    historyTable.innerHTML = "<p>No history found for this member</p>";
    return;
  }
  let html = `
        <table class='results-table'>
                <tr><th>Book</th><th>Checked-out</th><th>Returned</th><th>Ovedue Fine</th></tr>
    `;
  books.forEach((register) => {
    const checkoutDate = new Date(register.checkoutDate).toLocaleDateString();
    const returnDate = new Date(register.returnDate).toLocaleDateString();
    const overdueFine =
      register.overdueFine !== null
        ? `${parseFloat(register.overdueFine).toFixed(2)} USD`
        : "";
    html += `
            <tr>
                <td><a  href="book-info.html?id=${register.bookId}">${register.bookTitle},${register.bookAuthor}</a></td>
                <td>${checkoutDate}</td>
                <td>${returnDate}</td>
                <td>${overdueFine}</td>
            </tr>
        `;
  });
  html += `</table>`;
  historyTable.innerHTML = html;
}
