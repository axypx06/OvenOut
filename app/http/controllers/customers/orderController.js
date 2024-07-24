const Order = require('../../../models/order');
const moment = require('moment');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

function orderController() {
    return {
        async store(req, res) {
            // Validate request
            const { phone, address, stripeToken, paymentType } = req.body;
            if (!phone || !address) {
                return res.status(422).json({ message: 'All fields are required' });
                // req.flash('error', 'All fields are required');
                // return res.redirect('/cart');
            }

            try {
                const order = new Order({
                    customerId: req.user._id,
                    items: req.session.cart.items,
                    phone,
                    address
                });

                const result = await order.save();
                await Order.populate(result, { path: 'customerId' });

                // Stripe payment
                if (paymentType === 'card') {
                    try {
                        await stripe.charges.create({
                            amount: req.session.cart.totalPrice * 100,
                            source: stripeToken,
                            currency: 'inr',
                            description: `Pizza order: ${result._id}`
                        });

                        result.paymentStatus = true;
                        result.paymentType = paymentType;
                        await result.save();

                        // Emit event
                        const eventEmitter = req.app.get('eventEmitter');
                        eventEmitter.emit('orderPlaced', result);
                        delete req.session.cart;

                        return res.json({ message: 'Payment successful, Order placed successfully' });
                    } catch (err) {
                        delete req.session.cart;
                        return res.json({ message: 'Order placed but payment failed, You can pay at delivery time' });
                    }
                } else {
                    result.paymentStatus = false; // Explicitly set paymentStatus for COD
                    result.paymentType = paymentType;
                    await result.save();
                    
                    // Emit event
                    const eventEmitter = req.app.get('eventEmitter');
                    eventEmitter.emit('orderPlaced', result);
                    delete req.session.cart;

                    return res.json({ message: 'Order placed successfully. You can pay at delivery time.' });
                }
            } catch (err) {
                console.log(err);
                return res.status(500).json({ message: 'Something went wrong' });
            }
        },
        async index(req, res) {
            try {
                const orders = await Order.find({ customerId: req.user._id }, null, { sort: { 'createdAt': -1 } });
                res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-age=0, post-check=0, pre-check=0');
                res.render('customers/orders', { orders: orders, moment: moment });
            } catch (err) {
                console.log(err);
                res.status(500).send('Something went wrong');
            }
        },
        async show(req, res) {
            try {
                const order = await Order.findById(req.params.id);
                // Authorize user
                if (req.user._id.toString() === order.customerId.toString()) {
                    return res.render('customers/singleOrder', { order });
                }
                return res.redirect('/');
            } catch (err) {
                console.log(err);
                res.status(500).send('Something went wrong');
            }
        }
    };
}

module.exports = orderController;




// const Order = require('../../../models/order');
// const moment = require('moment');

// function orderController() {
//     return {
//         async store(req, res) {
//             // Validate request
//             const { phone, address } = req.body;
//             if (!phone || !address) {
//                 req.flash('error', 'All fields required');
//                 return res.redirect('/cart');
//             }

//             try {
//                 const order = new Order({
//                     customerId: req.user._id,
//                     items: req.session.cart.items,
//                     phone,
//                     address
//                 });

//                 const result = await order.save();
//                 await Order.populate(result, { path: 'customerId' });
//                 req.flash('success', 'Order placed successfully');
//                 delete req.session.cart;

//                 const eventEmitter = req.app.get('eventEmitter')
//                 eventEmitter.emit('orderPlaced', result)

//                 return res.redirect('/customer/orders');
//             } catch (err) {
//                 console.log(err);
//                 req.flash('error', 'Something went wrong');
//                 return res.redirect('/cart');
//             }
//         },
//         async index(req, res) {
//             try {
//                 const orders = await Order.find({ customerId: req.user._id }, null, { sort: { 'createdAt': -1 } });
//                 res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-age=0, post-check=0, pre-check=0');
//                 res.render('customers/orders', { orders: orders, moment: moment });
//             } catch (err) {
//                 console.log(err);
//                 res.status(500).send('Something went wrong');
//             }
//         },
//         async show(req, res) {
//             const order = await Order.findById(req.params.id)
//             // Authorize user
//             if(req.user._id.toString() === order.customerId.toString()) {
//                 return res.render('customers/singleOrder', { order })
//             }
//             return  res.redirect('/')
//         }
//     };
// }

// module.exports = orderController;
