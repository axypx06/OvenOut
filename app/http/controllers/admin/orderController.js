const order = require("../../../models/order");

function orderController() {
    return {
        async index(req, res) {
            try {
                const orders = await order.find({ status: { $ne: 'completed' } }, null, { sort: { 'createdAt': -1 }})
                                          .populate('customerId', '-password')
                                          .exec();
                
                if (req.xhr) {
                    return res.json(orders);
                } else {
                    return res.render('admin/orders');
                }
            } catch (err) {
                console.error(err);
                return res.status(500).send(err);
            }
        }
    };
}

module.exports = orderController;
