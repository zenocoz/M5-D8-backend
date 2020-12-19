const { Router } = require("express")
const express = require("express")
const uniqid = require("uniqid")
const sgMail = require("@sendgrid/mail")
const { createReadStream, copySync } = require("fs-extra")
const { Transform } = require("json2csv")
const { pipeline } = require("stream")
const { join } = require("path")
const PdfPrinter = require("pdfmake")
let fonts = {
  Courier: {
    normal: "Courier",
    bold: "Courier-Bold",
    italics: "Courier-Oblique",
    bolditalics: "Courier-BoldOblique",
  },
}
const printer = new PdfPrinter(fonts)
const fs = require("fs")

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

// attendeesRouter.post("/:id/createPdf", async (req, res, next) => {
//   const attendees = await getAttendees()
//   const attendee = attendees.find((attendee) => attendee.ID === req.params.id)
//   const attendeeDetails = {
//     content: {
//       name: attendee.name,
//       surname: attendee.surname,
//       email: attendee.email,
//       id: attendee.ID,
//     },
//     defaultStyle: {
//       font: "Courier",
//     },
//   }

//   console.log(attendeeDetails)

//   // var docDefinition = {
//   //   content: [
//   //     'First paragraph',
//   //     'Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines',
//   //   ],
//   //   defaultStyle: {
//   //     font: 'Helvetica'
//   //   }
//   // };

//   // const fonts = {
//   //   Roboto: {
//   //     normal: "fonts/Roboto-Regular.ttf",
//   //     bold: "fonts/Roboto-Medium.ttf",
//   //     italics: "fonts/Roboto-Italic.ttf",
//   //     bolditalics: "fonts/Roboto-MediumItalic.ttf",
//   //   },
//   // }

//   // const fonts = {
//   //   Courier: {
//   //     normal: "Courier",
//   //     bold: "Courier-Bold",
//   //     italics: "Courier-Oblique",
//   //     bolditalics: "Courier-BoldOblique",
//   //   },
//   // }

//   const doc = printer.createPdfKitDocument(attendeeDetails)
//   res.setHeader("Content-Type", "application/pdf")
//   doc.pipe(res)
//   doc.end()
//   // doc.pipe(fs.createWriteStream("document3.pdf"))
//   // doc.pipe(res)
//   // doc.end()

//   // const docAsStream = pdfDoc.createPdfKitDocument(docDefinition)

//   // res.setHeader("Content-Type", `application/pdf`)
//   // console.log(docAsStream)
//   // docAsStream.pipe(res)
//   // docAsStream.end()

//   // if(!attendee.hasOWnProperty("pdf") {
//   //   attendee.pdf = doc
//   // })

//   // const chunks = []
//   // let result = null
//   // doc.on("data", (chunk) => {
//   //   chunks.push(chunk)
//   // })
//   // doc.on("end", () => {
//   //   result = Buffer.concat(chunks)
//   //   callback("data:application/pdf;base64," + result.toString("base64"))
//   // })
//   // doc.end()
//   // res.contentType("application/pdf")
//   // res.send(doc)

//   console.log("endpoint here")
// })

module.exports = attendeesRouter
