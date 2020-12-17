const { Router } = require("express")
const express = require("express")
const uniqid = require("uniqid")
const sgMail = require("@sendgrid/mail")
const { createReadStream } = require("fs-extra")
const { Transform } = require("json2csv")
const { pipeline } = require("stream")
const { join } = require("path")

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

    const msg = {
      to: `${req.body.email}`,
      from: "federico.soncini@gmail.com",
      subject: "Sending with Twilio SendGrid is Fun",
      text: "and easy to do anywhere, even with Node.js",
      html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    }
    await sgMail.send(msg)

    const newAttendee = {
      ...req.body,
      ID: uniqid(),
      arrivedAt: new Date(),
    }
    attendees.push(newAttendee)
    await writeAttendees(attendees)

    res.send(attendees)
  } catch (error) {
    console.log(error)
    const err = new Error("An error occurred while reading from the file")
    next(err)
  }
})

attendeesRouter.post("/sendEmail", async (req, res, next) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const msg = {
      to: "soncini@icloud.com",
      from: "federico.soncini@gmail.com",
      subject: "Sending with Twilio SendGrid is Fun",
      text: "and easy to do anywhere, even with Node.js",
      html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    }
    await sgMail.send(msg)
    res.send("sent")
  } catch (error) {
    next(error)
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
  } catch (error) {
    console.log(error)
  }
})

module.exports = attendeesRouter
