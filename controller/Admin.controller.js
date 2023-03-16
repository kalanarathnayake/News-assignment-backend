const bcrypt = require("bcryptjs"); //hash feature
const Admin = require("../model/Admin.model");
const Counter = require("../model/Counter.model")
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer")

//get Admin details
const getAdmin = async (req, res) => {
  try {
    //get user details
    //-password : dont return the pasword
    const user = await Admin.findById(req.user.id).select("-password");
    res.json(user);
  } catch {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
};

//Authenticate admin and get token
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    //See if user Exist
    let user = await Admin.findOne({ email });

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
    }

    //match the user email and password

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
    }

    //Return jsonwebtoken

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, "mysecrettoken", { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    //Something wrong with the server
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

  //Register admin
  const register = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    //See if user Exist
    let user = await Admin.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: "Admin already exist" }] });
    }

    //counter id feature
    Counter.findOneAndUpdate(
      { id: 'autoval' },
      { "$inc": { seq: 1 } },
      { new: true }, async (err, cd) => {
        let seqId;
        if (cd == null) {
          const newval = new Counter({ id: "autoval", seq: 1 })
          newval.save()
          seqId = 1
        }
        else {
          seqId = cd.seq
        }

        //create a user instance
        user = new Admin({
          fullName,
          email,
          password,
          id: seqId
        });

        //Encrypt Password feature
        //10 is enogh..if you want more secured.user a value more than 10
        const salt = await bcrypt.genSalt(10);

        //hashing password
        user.password = await bcrypt.hash(password, salt);

        //save user to the database
        await user.save();

        //Return jsonwebtoken
        const payload = {
          user: {
            id: user.id,
          },
        };

        jwt.sign(payload, "mysecrettoken", { expiresIn: 360000 }, (err, token) => {
          if (err) throw err;
          res.json({ token });
        });

        // nodemailer feature
        let testAccount = await nodemailer.createTestAccount();

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
          },
        });

        // send mail with defined transport object
        let message = {
          from: '"Fred Foo 👻" <foo@example.com>', // sender address
          to: "bar@example.com, baz@example.com", // list of receivers
          subject: "Hello ✔", // Subject line
          text: "Hello world?", // plain text body
          html: "<b>Hello world?</b>", // html body
        }

        transporter.sendMail(message).then(() => {
          return res.status(201).json({msg:"Employee Should Receive an email."})
        }).catch(err => {s
          return res.status(500).json({error})
        })
      }
    )

  } catch (err) {
    //Something wrong with the server
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

module.exports = { getAdmin, login, register };
