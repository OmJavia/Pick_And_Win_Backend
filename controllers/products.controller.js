const { json } = require('body-parser');
const mysql = require('../config/mysqlconnection');
const { query } = require('express');
const crypto = require('crypto');
// const { console } = require('inspector');
//const { console } = require('inspector');



function addProducts(req, res) {
    try {
        const { name, price, ticket_price, ticket_quantity, draw_date } = req.body;
        // console.log(req.body)

        console.log(`/images/${req.file.filename}`, "<=======file");
        const filepath = `/images/${req.file.filename}`;

        // Validate all required fields
        if (!name || !price || !ticket_price || !ticket_quantity || !draw_date) {
            return res.status(400).json({ msg: "All fields are required" });
        }
        
        // Ensure the draw_date is in a valid format (example YYYY-MM-DD)
        if (isNaN(new Date(draw_date).getTime())) {
            return res.status(400).json({ msg: "Invalid draw date" });
        }

        const checkProduct = `SELECT * FROM products WHERE product_name = ?`;
        mysql.query(checkProduct, [name], (err, data, fields) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: "Error in database" });
            }

            if (data.length > 0) {
                console.log(data.length);
                return res.status(400).json({ msg: "Product already exists" });
            }

            // Insert product along with draw_date
            const insertProduct = `INSERT INTO products (product_name, product_price, ticket_price, ticket_quantity, image_path, draw_date) VALUES (?, ?, ?, ?, ?, ?)`;
            mysql.query(insertProduct, [name, price, ticket_price, ticket_quantity, filepath, draw_date], (err, result, fields) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ msg: "Error while adding product" });
                } else {
                    return res.status(200).json({ msg: "Product added successfully" });
                }
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Internal server error" });
    }
}


function getProducts(req, res) {
    try {
        const viewProducts = `select * from products`;

        mysql.query(viewProducts, (err, data, fields) => {
            if (err) {
                return res.status(400).json({ msg: "Problem with DB" })
            }
            if (data) {
                const totalProducts = data.length;
                return res.status(200).json({
                    msg: "Products fetched successfully",
                    data: data,
                    total: totalProducts
                })
            }
        })

    } catch (error) {
        return res.status(500).json({ msg: "Internal server problem" })
    }
}

const getProductsbyid = (req, res) => {
    const id = req.params.id;
    const viewProduct = 'SELECT * FROM products WHERE id = ?';
    mysql.query(viewProduct, [id], (err, data) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ msg: "An error occurred while fetching the product." });
        }

        if (data.length === 0) {
            return res.status(404).json({ msg: "Product not found" });
        }

        return res.status(200).json({ msg: "Product fetched successfully", data: data[0] });
    });
};


function deleteProduct(req, res) {
    try {
        const { id } = req.params; // Get the product ID from URL params

        if (!id) {
            return res.status(400).json({ msg: "Product ID is required" });
        }

        // Check if the product with the given ID exists
        const checkProduct = `SELECT * FROM products WHERE id = ?`;

        mysql.query(checkProduct, [id], (err, data, fields) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ msg: "Database Error" });
            }

            if (data.length > 0) {
                // If the product exists, proceed to delete
                const deleteProductQuery = `DELETE FROM products WHERE id = ?`;

                mysql.query(deleteProductQuery, [id], (err, data, fields) => {
                    if (err) {
                        console.log(err);
                        return res.status(400).json({ msg: "SQL Error" });
                    } else {
                        return res.status(200).json({ msg: "Product Deleted Successfully" });
                    }
                });
            } else {
                return res.status(404).json({ msg: "Product not found" });
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
}


function updateProduct(req, res) {
    try {
        const { name, newname } = req.body;
        if (!name || !newname) {
            return res.status(400).json({ msg: "Please enter both current and new product names" });
        }
        const checkProductQuery = 'SELECT * FROM products WHERE product_name = ?';
        mysql.query(checkProductQuery, [name], (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: "Database Error" });
            }

            if (data.length > 0) {
                const updateProductQuery = 'UPDATE products SET product_name = ? WHERE product_name = ?';
                mysql.query(updateProductQuery, [newname, name], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ msg: "Failed to update product" });
                    }
                    return res.status(200).json({ msg: "Product updated successfully" });
                });
            } else {
                return res.status(404).json({ msg: "Product not found" });
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Internal server problem" });
    }
}


function updateProductbyid(req, res) {
    try {
    //   console.log("Request Body:", req.body);
      console.log("Uploaded File:", req.file);
  
      const { id } = req.params;
      const { name, price, ticket_quantity, ticket_price, draw_date } = req.body;
  
      // Check if a file is uploaded and set the image path accordingly
      let imagePath = req.file ? "/images/" + req.file.filename : null;
  
      // Query to check if the product exists
      const checkProductQuery = "SELECT * FROM products WHERE id = ?";
      mysql.query(checkProductQuery, [id], (err, data, fields) => {
        if (err) {
          console.error("Database Error (Check Product):", err);
          return res.status(500).json({ msg: "Error in database" });
        }
  
        if (data.length === 0) {
          return res.status(404).json({ msg: "Product not found" });
        }
  
        // Use the existing image path if no new image is provided
        const existingImagePath = data[0].image_path;
        imagePath = imagePath || existingImagePath;
  
        // Query to update the product
        const updateProductQuery = `
          UPDATE products 
          SET 
            product_name = ?, 
            product_price = ?, 
            ticket_quantity = ?, 
            ticket_price = ?, 
            draw_date = ?, 
            image_path = ?
          WHERE id = ?
        `;
  
        mysql.query(
          updateProductQuery,
          [name, price, ticket_quantity, ticket_price, draw_date, imagePath, id],
          (err, result, fields) => {
            if (err) {
              console.error("Database Error (Update Product):", err);
              return res.status(500).json({ msg: "Error while updating product" });
            }
  
            return res.status(200).json({ msg: "Product updated successfully" });
          }
        );
      });
    } catch (error) {
      console.error("Server Error:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  }
  


function orderplace(req, res) {
    try {
        const { product_id, quantity } = req.body;
        const { user_id } = req.user;

        // Validate input
        if (!product_id || !quantity) {
            return res.status(400).json({ msg: "Please provide product ID and quantity" });
        }

        // Validate if sufficient stock is available for the specific product
        const checkStockQuery = `SELECT ticket_quantity FROM products WHERE id = ?`;

        mysql.query(checkStockQuery, [product_id], (err, stockResult) => {
            if (err) {
                return res.status(400).json({ msg: "SQL error while checking stock" });
            }

            if (stockResult.length === 0) {
                return res.status(404).json({ msg: "Product not found" });
            }

            const availableStock = stockResult[0].ticket_quantity;

            // Check if there is enough stock for the specified quantity
            if (availableStock < quantity) {
                return res.status(400).json({ msg: "Insufficient stock for the specified product" });
            }

            // Create the order for the specified product
            const makeOrder = `INSERT INTO orders (product_id, quantity, user_id) VALUES (?, ?, ?)`;

            mysql.query(makeOrder, [product_id, quantity, user_id], (err, data) => {
                if (err) {
                    return res.status(400).json({ msg: "SQL error while inserting order" });
                }

           

            
                const orderId = data.insertId;
                const tickets = []; 
                
                for (let i = 1; i <= quantity; i++) {
                    const randomNum = Math.floor(Math.random() * 100000); // Generate a random number (up to 99999)
                    const ticketSerial = "PAW" + randomNum + "_" + i; // Combine "PAW", random number, and sequential index
                    tickets.push({ ticket_id: ticketSerial, order_id: orderId });
                }
                


                // Insert multiple tickets at once
                const makeTicketsQuery = `INSERT INTO ticket (ticket_id, order_id) VALUES ?`;
                const values = tickets.map(ticket => [ticket.ticket_id, ticket.order_id]);

                mysql.query(makeTicketsQuery, [values], (err) => {
                    if (err) {
                        return res.status(400).json({ msg: "SQL error while inserting tickets" });
                    }

                    // Reduce quantity in the product table after successful order
                    const reduceQuantity = `
                        UPDATE products
                        SET sold_tickets = sold_tickets + ?
                        WHERE id = ?`;

                    mysql.query(reduceQuantity, [quantity, product_id], (err, result) => {
                        if (err) {
                            return res.status(400).json({ msg: "SQL error while updating product quantity" });
                        }

                        // Check if quantity was updated
                        if (result.affectedRows === 0) {
                            return res.status(400).json({ msg: "Unable to update product quantity" });
                        }

                        // Respond with success
                        return res.status(200).json({
                            msg: "Order placed successfully",
                            order_id: orderId,
                            ticket_ids: tickets.map(ticket => ticket.ticket_id) // Send all ticket IDs
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error("Internal server error:", error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
}





function payment(req, res) {
    try {

    } catch (error) {
        return res.status(500).json({ msg: "Internal server problem" });
    }
}

function myorder(req, res) {
    try {
        const { user_id } = req.user;
        const { page_no, page_size } = req.query;

        if (!user_id) {
            return res.status(400).json({ msg: "User ID is required" });
        }

        const pageNo = parseInt(page_no) || 1;
        const pageSize = parseInt(page_size) || 10;

        if (pageNo < 1 || pageSize < 1) {
            return res.status(400).json({ msg: "Page number and size must be positive integers" });
        }

        const offset = (pageNo - 1) * pageSize;

        const countQuery = `
            SELECT COUNT(*) AS total_tickets 
            FROM payment 
            WHERE user_id = ?;
        `;

        mysql.query(countQuery, [user_id], (err, countResult) => {
            if (err) {
                return res.status(400).json({ msg: "SQL error while counting tickets" });
            }

            const totalTickets = countResult[0]?.total_tickets || 0;

            const viewOrderQuery = `
                SELECT 
                    p.order_id,
                    pr.product_name,
                    pr.ticket_price,
                    p.created_at,
                    COUNT(t.ticket_id) AS total_tickets
                FROM payment p
                JOIN products pr ON p.product_id = pr.id
                LEFT JOIN ticket t ON p.order_id = t.order_id
                WHERE p.user_id = ?
                GROUP BY p.order_id, pr.product_name, pr.ticket_price, p.created_at
                LIMIT ? OFFSET ?;
            `;

            mysql.query(viewOrderQuery, [user_id, pageSize, offset], (err, orders) => {
                if (err) {
                    return res.status(400).json({ msg: "SQL error while fetching orders" });
                }

                if (orders.length === 0) {
                    return res.status(404).json({ msg: "No orders found for this user" });
                }

                return res.status(200).json({
                    orders,
                    totalTickets
                });
            });
        });
    } catch (error) {
        console.error("Internal Server Error:", error);
        return res.status(500).json({ msg: "Internal server problem" });
    }
}







module.exports = {
    addProducts,
    getProducts,
    deleteProduct,
    updateProduct,
    orderplace, getProductsbyid,
    myorder, updateProductbyid
};
