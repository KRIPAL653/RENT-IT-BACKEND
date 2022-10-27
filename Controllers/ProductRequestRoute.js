import Agreement from "../Models/Agreement";
import Product from "../Models/Product";
import ProductRequest from "../Models/ProductRequest";

export const postRequest = {
  validator: (req, res, next) => {
    if (
      !req.body.message ||
      !req.body.prodId ||
      !req.body.prodName ||
      !req.body.prodImg ||
      !req.body.ownerId ||
      !req.body.ownerAvatar ||
      !req.body.ownerName
    ) {
      return res.status(400).send("Pass message for request");
    }

    next();
  },
  controller: async (req, res) => {
    try {
      const {
        message,
        prodId,
        prodName,
        prodImg,
        ownerId,
        ownerAvatar,
        ownerName,
      } = req.body;

      const productRequest = await ProductRequest.create({
        message,
        product: {
          _id: prodId,
          name: prodName,
          img: prodImg,
        },
        owner: {
          _id: ownerId,
          username: ownerName,
          avatar: ownerAvatar,
        },
        userid: req.currUser._id,
        username: req.currUser.username,
        avatar: req.currUser.avatar,
      });

      return res.send(productRequest);
    } catch (e) {
      return res.status(500).send("Internal Error");
    }
  },
};

export const deleteRequest = {
  validator: (req, res, next) => {
    if (!req.query?.reqId) {
      return res.status(400).send("Pass the reqId in query");
    }
    next();
  },
  controller: async (req, res) => {
    try {
      const { reqId } = req.query;

      

      const prodReq = await ProductRequest.findById(reqId);

      if(prodReq.userid !== req.currUser._id){
        return res.status(400).send("You can't delete this request")
      }

      await ProductRequest.findByIdAndDelete(reqId)

      return res.send("Deleted the request");
    } catch (e) {
      return res.status(500).send("Internal Server Error");
    }
  },
};

export const getMyRequests = {
  controller: async (req, res) => {
    try {
      const { _id } = req.currUser;
      const sented = await ProductRequest.find({ userid: _id });
      const received = await ProductRequest.find({ owner: { _id: _id } });

      const response = {
        sented,
        received,
      };

      return res.send(response);
    } catch (e) {
      return res.status(500).send();
    }
  },
};

export const acceptRequest = {
  validator: (req, res, next) => {
    if (!req.body.reqId || !req.body.revokeDate) {
      return res.status(400).send("Pass reqId and date in query");
    }
  },
  controller: async (req, res) => {
    try {
      const { reqId ,revokeDate} = req.body;

      const prodReq = await ProductRequest.findOne(reqId);

      if (prodReq.owner._id !== req.currUser._id) {
        return res.status(400).send("You are not allowed to accept request");
      }

      






      const updateProduct = await Product.findByIdAndUpdate(prodReq.product._id, {
        issued: true,
        borrowerid:prodReq.userid
    })

    const today = new Date();
    const revokedate = new Date(revokeDate);
    const addAgreement = await Agreement.create({
        renterid: req.currUser._id.toString(),
        borrowerid: prodReq.userid,
        assigndate: today,
        revokedate: revokedate,
        productid: prodReq.product._id
    });

    res.status(200).send({
        "message": "Product assign successful",
        ...addAgreement._doc
    });














    } catch (e) {

        return res.status(500).send("Error")
    }
  }
};

export const declineRequests = {
  validator: (req, res, next) => {
    if (!req.query.reqId) {
      return res.status(400).send("Pass reqId in query");
    }
  },
  controller: async (req, res) => {
    try {
      const { reqId } = req.query;

      const prodReq = await ProductRequest.findOne(reqId);

      if (prodReq.owner._id !== req.currUser._id) {
        return res.status(400).send("You are not allowed to decline request");
      }

      await ProductRequest.findByIdAndDelete(reqId);

      return res.send("Successfully Declined");
    } catch (e) {

        return res.status(500).send("Error")
    }
  },
};
