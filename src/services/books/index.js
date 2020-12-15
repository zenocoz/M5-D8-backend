const { Router } = require("express")
const express = require("express")
const uniqid = require("uniqid")

const { getBooks, writeBooks } = require("../../fsUtilities")

const booksRouter = express.Router()

booksRouter.get("/", async (req, res, next) => {
  try {
    const books = await getBooks()

    if (req.query && req.query.category) {
      const filteredBooks = books.filter(
        (book) =>
          book.hasOwnProperty("category") &&
          book.category === req.query.category
      )
      res.send(filteredBooks)
    } else {
      res.send(books)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

booksRouter.get("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks()

    const bookFound = books.find((book) => book.asin === req.params.asin)

    if (bookFound) {
      res.send(bookFound)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

booksRouter.post("/", async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error()
      error.message = errors
      error.httpStatusCode = 400
      next(error)
    } else {
      const books = await getBooks()

      const asinFound = books.find((book) => book.asin === req.body.asin)

      if (asinFound) {
        const error = new Error()
        error.httpStatusCode = 400
        error.message = "Book already in db"
        next(error)
      } else {
        books.push(req.body)
        await writeBooks(books)
        res.status(201).send({ asin: req.body.asin })
      }
    }
  } catch (error) {
    console.log(error)
    const err = new Error("An error occurred while reading from the file")
    next(err)
  }
})

booksRouter.put("/:asin", async (req, res, next) => {
  try {
    const validatedData = matchedData(req)
    const books = await getBooks()

    const bookIndex = books.findIndex((book) => book.asin === req.params.asin)

    if (bookIndex !== -1) {
      // book found
      const updatedBooks = [
        ...books.slice(0, bookIndex),
        { ...books[bookIndex], ...validatedData },
        ...books.slice(bookIndex + 1),
      ]
      await writeBooks(updatedBooks)
      res.send(updatedBooks)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    console.log(error)
    const err = new Error("An error occurred while reading from the file")
    next(err)
  }
})

booksRouter.delete("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks()

    const bookFound = books.find((book) => book.asin === req.params.asin)

    if (bookFound) {
      const filteredBooks = books.filter(
        (book) => book.asin !== req.params.asin
      )

      await writeBooks(filteredBooks)
      res.status(204).send()
    } else {
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

//Comments

//Add Comment for book id
booksRouter.post("/:bookId/comments", async (req, res, next) => {
  try {
    const books = await getBooks()
    const bookIndex = books.findIndex((book) => book.asin === req.params.bookId)

    if (bookIndex !== -1) {
      const newComment = {
        ...req.body,
        commentId: uniqid(),
        createdAt: new Date(),
      }

      if (!books[bookIndex].hasOwnProperty("comments")) {
        books[bookIndex].comments = []
        books[bookIndex].comments.push(newComment)
      } else {
        books[bookIndex].comments.push(newComment)
      }
      await writeBooks(books)
      res.status(201).send({ "comment created with Id:": newComment.commentId })
    } else {
      const err = new Error("book asin not found")
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    next(error)
  }
})

//Get all the comments for book id
booksRouter.get("/:bookId/comments", async (req, res, next) => {
  try {
    const books = await getBooks()
    const bookIndex = books.findIndex((book) => book.asin === req.params.bookId)
    if (bookIndex !== -1) {
      if (
        !books[bookIndex].hasOwnProperty("comments") ||
        books[bookIndex].comments.length === 0
      ) {
        const err = new Error("there are no comments for this book")
        err.httpStatusCode = 404
        next(err)
      } else {
        res.status(201).send(books[bookIndex].comments)
      }
    } else {
      const err = new Error("book asin not found")
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    next(error)
  }
})

//delete comment from single book
booksRouter.delete("/:bookId/comments/:commentId", async (req, res, next) => {
  try {
    const books = await getBooks()
    const singleBook = books.find((book) => book.asin === req.params.bookId)
    if (!singleBook) {
      const err = new Error("book not found")
      err.httpStatusCode = 404
      next(err)
    } else {
      if (
        !singleBook.hasOwnProperty("comments") ||
        singleBook.comments.length === 0
      ) {
        const err = new Error()
        err.message = "There are no comments for this book"
        err.httpStatusCode = 404
        next(err)
      } else {
        const filteredComments = singleBook.comments.filter(
          (comment) => comment.commentId !== req.params.commentId
        )
        singleBook.comments = filteredComments
        await writeBooks(books)
        res.status(204).send()
      }
    }
  } catch (error) {
    next(error)
  }
})

//delete single comment from /comments
booksRouter.delete("/comments/:commentId", async (req, res, next) => {
  try {
    console.log("OKAY")
    const books = await getBooks()

    const booksWithComments = books.filter((book) =>
      book.hasOwnProperty("comments")
    )

    if (booksWithComments) {
      // const allComments = [].concat(
      //   ...booksWithComments.map(({ comments }) => comments)
      // )

      let alteredComment = {}
      let alteredComments = []
      for (let i = 0; i < booksWithComments.length; i++) {
        for (let j = 0; j < booksWithComments[i].comments.length; j++) {
          alteredComment = {
            ...booksWithComments[i].comments[j],
            bookAsin: booksWithComments[i].asin,
          }
          alteredComments.push(alteredComment)
        }
      }
      let commentTodelete = alteredComments.find(
        (comment) => comment.commentId === req.params.commentId
      )
      console.log(commentTodelete.commentId)
      console.log(commentTodelete.bookAsin)

      const singleBook = books.find(
        (book) => book.asin === commentTodelete.bookAsin
      )
      const filteredComments = singleBook.comments.filter(
        (comment) => comment.commentId !== commentTodelete.commentId
      )
      singleBook.comments = filteredComments

      await writeBooks(books)
      res.status(204).send()
    }
  } catch (error) {
    next(error)
  }
})

module.exports = booksRouter
