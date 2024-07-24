function cartController() {
    return {
        index(req, res) {
            return res.render('customers/cart');
        },
        update(req, res) {
            if (!req.session.cart) {
                req.session.cart = {
                    items: {},
                    totalQty: 0,
                    totalPrice: 0,
                };
            }
            let cart = req.session.cart;

            if (!cart.items[req.body._id]) {
                cart.items[req.body._id] = {
                    item: req.body,
                    qty: 1,
                };
                cart.totalQty = cart.totalQty + 1;
                cart.totalPrice = cart.totalPrice + req.body.price;
            } else {
                cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1;
                cart.totalQty = cart.totalQty + 1;
                cart.totalPrice = cart.totalPrice + req.body.price;
            }
            return res.json({ totalQty: req.session.cart.totalQty });
        },
        remove(req, res) {
            let cart = req.session.cart;
            let itemId = req.body._id;

            if (cart.items[itemId]) {
                let item = cart.items[itemId];
                if (item.qty > 1) {
                    item.qty -= 1;
                    cart.totalQty -= 1;
                    cart.totalPrice -= item.item.price;
                } else {
                    cart.totalQty -= item.qty;
                    cart.totalPrice -= item.qty * item.item.price;
                    delete cart.items[itemId];
                }
            }

            return res.json({ totalQty: cart.totalQty, totalPrice: cart.totalPrice });
        },
    };
}

module.exports = cartController;















// function cartController(){
//     return {
//         index(req, res) {
//         return res.render('customers/cart')
//     },
//     update(req, res) {
        
//         //  first time creating cart and add basic object structure
//         if (!req.session.cart) {
//             req.session.cart = {
//                 items: {},
//                 totalQty: 0,
//                 totalPrice: 0
//             }
//         }
//         let cart = req.session.cart

//         // if item does not exist in cart 
//         if(!cart.items[req.body._id]) {
//             cart.items[req.body._id] = {
//                 item: req.body,
//                 qty: 1
//             }
//             cart.totalQty = cart.totalQty + 1
//             cart.totalPrice = cart.totalPrice + req.body.price
//         } else {
//             cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1
//             cart.totalQty = cart.totalQty + 1
//             cart.totalPrice =  cart.totalPrice + req.body.price
//         }
//         return res.json({ totalQty: req.session.cart.totalQty })
//     }
// }
// }

// module.exports = cartController