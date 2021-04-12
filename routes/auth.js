const router = require("express").Router();
const User = require("../model/User");
const { registerValidation, loginValidation } = require("../validation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res, next) => {
  //Lets validate the data before we add a user
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Checking if the user already exists
  const emailExists = await User.findOne({ email: req.body.email });
  if (emailExists) return res.status(400).send("Email already exists");

  //Hash password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  //Create a new user
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashPassword,
  });
  try {
    const savedUser = await user.save();
    res.send({ user: user._id });
  } catch (err) {
    res.status(400).send(err);
  }
});

//LOGIN
router.post("/login", async (req, res, next) => {
  //Lets validate the data before we add a user
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  //Checking if the email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Email and/or password invalid.");

  //Checking if password is correct
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).send("Email and/or password invalid.");

  //Create and assign a token
  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
  res.header("x-api-key", token).send({ API_KEY: token });
});

module.exports = router;
