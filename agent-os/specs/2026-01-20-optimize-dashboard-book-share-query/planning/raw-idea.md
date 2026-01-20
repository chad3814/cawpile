# Raw Idea

bug: the dashboard queries for the user's books, and passes the books to <DashboardClient>, and each book eventually goes to a <BookCard>. <BookCard> has an effect that pings /api/user/books/${book.id}/share to see if the user has shared the book. We should just include this in the original query
