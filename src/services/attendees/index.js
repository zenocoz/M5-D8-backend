const { Router } = require("express")
const express = require("express")
const uniqid = require("uniqid")
const sgMail = require("@sendgrid/mail")
const { createReadStream } = require("fs-extra")
const { Transform } = require("json2csv")
const { pipeline } = require("stream")

const { getAttendees, writeAttendees } = require("../../fsUtilities")

const attendeesRouter = express.Router()

attendeesRouter.post("/", async (req, res, next) => {
  try {
    // const errors = validationResult(req)
    // if (!errors.isEmpty()) {
    //   const error = new Error()
    //   error.message = errors
    //   error.httpStatusCode = 400
    //   next(error)
    // } else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const attendees = await getAttendees()
    const newAttendee = {
      ...req.body,
      ID: uniqid(),
      arrivedAt: new Date(),
    }
    attendees.push(newAttendee)
    await writeAttendees(attendees)

    const msg = {
      to: newAttendee.email,
      from: "federico.soncini@gmail.com",
      subject: "Sending with Twilio SendGrid is Fun",
      text: "and easy to do anywhere, even with Node.js",
      html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    }
    console.log(msg)

    await sgMail.send(msg)

    res.send(attendees)
  } catch (error) {
    console.log(error)
    const err = new Error("An error occurred while reading from the file")
    next(err)
  }
})

attendeesRouter.get("/csv", async (req, res, next) => {
  try {
    const path = join(__dirname, "attendees.json")
    const jsonReadableStream = createReadStream(path)
    const json2csv = new Transform({
      fields: ["name", "surname", "email"],
    })
    res.setHeader("Content-Disposition", "attachment; filename=export.csv")
    pipeline(jsonReadableStream, json2csv, res, (err) => {
      if (err) {
        console.log(err)
        next(err)
      } else {
        console.log("Done")
      }
    })
  } catch (error) {}
})

module.exports = attendeesRouter
