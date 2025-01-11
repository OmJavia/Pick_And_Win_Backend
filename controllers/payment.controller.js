require("dotenv").config("../.env");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mysql = require("../config/mysqlconnection");

// const user_id = request.user.id;
// const paymentSchema = require("../model/paymentSchema");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

// Create a Razorpay order
const checkout = async (req, res) => {
  try {
    var { amount, quantity, product_id, razorpay_payment_id } = req.body;
    const { user_id } = req.user;

    const checkdataquery = `SELECT (ticket_quantity - sold_tickets) as available_tickets FROM products WHERE (ticket_quantity - sold_tickets) >= ? && id = ?;`;

    mysql.query(checkdataquery, [quantity, product_id], (err, result) => {
      if (result[0].available_tickets < quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid quantity" });
      } else {
        const updatequery = `UPDATE products SET sold_tickets = (sold_tickets + ? ) WHERE id = ?`;
        mysql.query(updatequery, [quantity, product_id], (err, result) => {
          if (err) {
            console.log(err);
          }
        });
      }
    });

    if (!amount || isNaN(amount)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100), // Amount in smallest currency unit (paise for INR)
      currency: "INR",
    };

    const order = await instance.orders.create(options);
    console.log(order);
    const insertquery = `INSERT INTO payment ( order_id, user_id, transaction_id, total_payment, product_id, quantity) VALUES (?,?,?,?,?,?)`;
    mysql.query(
      insertquery,
      [order.id, user_id, razorpay_payment_id, amount, product_id, quantity],
      (err, result) => {
        if (err) {
          console.log(err);
        }
      }
    );

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
};

const key = async (req, res) => {
  res.status(200).json({
    key: process.env.RAZORPAY_API_KEY,
  });
};

// const paymentVerification = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing payment details",
//       });
//     }

//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
//       .update(body.toString())
//       .digest("hex");


//     if (expectedSignature === razorpay_signature) {
//       // Check Tickets Available
//       const checkquery = `SELECT user_id, quantity, product_id 
//       FROM payment WHERE order_id = ?`;

//       mysql.query(checkquery, [razorpay_order_id], (err, result) => {
       
//         if (err || result.length === 0) {
//           console.log("Error Fetching Order Details:", err);
//           return res.status(400).json({ success: false, message: "Order Details Not Found" });
//         }

//         const { user_id, product_id, quantity } = result[0];

//         const checkdataquery = `SELECT ticket_quantity - sold_tickets AS available_tickets FROM products WHERE id = ?;`;

//         mysql.query(checkdataquery, [product_id], (err, tresult) => {
//           if (err || tresult.length === 0) {
//             console.log("Error Checking Ticket Availability:", err);
//             return res.status(400).json({
//                 success: false,
//                 message: "Product Not Foud or Ticket Not Available",
//               });
//           }

//         const available_tickets  = tresult[0].available_tickets;

//         if (available_tickets < quantity) {
          
//           const updatepaymentquery = `UPDATE payment SET transaction_id = ?,status = "Refunded" WHERE order_id = ?`;

//           mysql.query(updatepaymentquery, [razorpay_payment_id, razorpay_order_id])
//           return res.redirect(
//             `${process.env.REACT_APP_WEB}/paymentfailed?order_id=${razorpay_order_id}`);
//             }
          
//         const updatepaymentquery = `UPDATE payment SET transaction_id = ?,status= "Successful" WHERE order_id = ?`;

//         mysql.query(updatepaymentquery, [razorpay_payment_id, razorpay_order_id], (err) => {
//             if (err) {
//               console.log("Error Updating Payment Status:", err);
//               return res,status(500).json({
//                 success: false,
//                 message: "Failed to update payment status",
//               });
//             }
            
//             const tickets = [];
//             for (let i = 1; i <= quantity; i++) {
//               const randomNum = Math.floor(Math.random() * 10000);
//               const ticketSerial = `TICKET${randomNum}_${i}`;
//               tickets.push({ ticket_id: ticketSerial, order_id: razorpay_order_id });
//             }

//             const insertQuery = `INSERT INTO ticket (ticket_id, order_id,status) VALUES ?`;
//             const values = tickets.map(ticket => [ticket.ticket_id, ticket.order_id,"Not Declared"]);

//             mysql.query(insertQuery, [values], (err) => {
//               if (err) {
//                 console.log("Error Inserting Tickets:",err);
//                 return res.status(500).json({
//                   success: false,
//                   message: "Failed to insert tickets",
//                 });
//               }

//               const updatequery = `UPDATE products SET sold_tickets = (sold_tickets + ?) WHERE id = ?`;

//               mysql.query(updatequery, [quantity, product_id], (err, results) => {
//                 if (err || results.affectedRows === 0) {
//                   console.log("Error Updating Product Quantity:", err);
//                   return res.status(500).json({
//                     success: false,
//                     message: "Failed to update product quantity",
//                   });
//                 }
              

//               res.redirect(
//               `${process.env.REACT_APP_WEB}/paymentsuccess?order_id=${razorpay_order_id}`
//             );
//             });
//           });
//         });
//       });
//     });
//   } else {
//       res
//         .status(400)
//         .json({ success: false, message: "Invalid payment signature" });
//     }
//   } catch (error) {
//     console.error("Error verifying payment:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify payment",
//       error: error.message,
//     });
//   }
// };


const paymentVerification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", "35OHB2MWZok8t1wa7HG8ggys") // Replace with your secret key
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Check ticket availability
      const getOrderDetailsQuery = `
        SELECT user_id, product_id, quantity
        FROM payment
        WHERE order_id = ?
      `;

      mysql.query(getOrderDetailsQuery, [razorpay_order_id], (err, results) => {
        if (err || results.length === 0) {
          console.error("Error fetching order details:", err);
          return res.status(400).json({ success: false, message: "Order details not found" });
        }

        const { user_id, product_id, quantity } = results[0];

        const checkTicketAvailabilityQuery = `
          SELECT ticket_quantity - sold_tickets AS available_tickets
          FROM products
          WHERE id = ?
        `;

        mysql.query(checkTicketAvailabilityQuery, [product_id], (err, ticketResults) => {
          if (err || ticketResults.length === 0) {
            console.error("Error checking ticket availability:", err);
            return res.status(400).json({
              success: false,
              message: "Product not found or ticket availability check failed",
            });
          }

          const availableTickets = ticketResults[0].available_tickets;

          if (availableTickets < quantity) {
            const updatePaymentStatus = `
            UPDATE payment
            SET transaction_id = ?, status = "Refundable"
            WHERE order_id = ?
          `;
          mysql.query(updatePaymentStatus,[razorpay_payment_id,razorpay_order_id])
          return res.redirect(`${process.env.REACT_APP_WEB}/refund`);
          }

          // Update payment status to PAID
          const updatePaymentQuery = `
            UPDATE payment
            SET transaction_id = ?, status = ?
            WHERE order_id = ?
          `;

          mysql.query(updatePaymentQuery, [razorpay_payment_id, "PAID", razorpay_order_id], (err) => {
            if (err) {
              console.error("Error updating payment status:", err);
              return res.status(500).json({
                success: false,
                message: "Failed to update payment status",
              });
            }

            // Generate tickets and update product quantity (same logic as before)
            const tickets = [];
            for (let i = 1; i <= quantity; i++) {
              const randomNum = Math.floor(Math.random() * 100000);
              const ticketSerial = `PAW${randomNum}_${i}`;
              tickets.push({ ticket_id: ticketSerial, order_id: razorpay_order_id });
            }

            const insertTicketsQuery = `INSERT INTO ticket (ticket_id, order_id,status) VALUES ?`;
            const values = tickets.map(ticket => [ticket.ticket_id, ticket.order_id,"Not Declared"]);

            mysql.query(insertTicketsQuery, [values], (err) => {
              if (err) {
                console.error("Error inserting tickets:", err);
                return res.status(400).json({
                  success: false,
                  message: "Failed to generate tickets",
                });
              }

              const updateProductQuery = `
                UPDATE products
                SET sold_tickets = sold_tickets + ?
                WHERE id = ?
              `;

              mysql.query(updateProductQuery, [quantity, product_id], (err, result) => {
                if (err || result.affectedRows === 0) {
                  console.error("Error updating product quantity:", err);
                  return res.status(400).json({
                    success: false,
                    message: "Failed to update product quantity",
                  });
                }

                res.redirect(
                  `${process.env.REACT_APP_WEB}/paymentsuccess?order_id=${razorpay_order_id}`
                );
              });
            });
          });
        });
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};




module.exports = { checkout, key, paymentVerification };
