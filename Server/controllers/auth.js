import {db} from "../connect.js"
import bcrypt from "bcryptjs";//thu vien de Hass password
import jwt from "jsonwebtoken";

export const register = (req, res) => {

    //Kiem tra email da duoc su dung hay chua
    const q = "SELECT * FROM users WHERE email = ?";

    db.query(q, [req.body.email], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length) return res.status(409).json("Email has already been existed!");

        //Kiem tra email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json("Invalid email format!");
        }

        //Kiem tra mat khau
        if (req.body.password.length < 6 || !/[a-zA-Z]/.test(req.body.password)) {
          return res.status(400).json("Password must be at least 6 characters long and contain at least one letter!");
        }

        //Tao nguoi dung moi
        //Hash password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt);
    
        const q = "INSERT INTO users (`username`,`email`,`password`,`name`, `gender`, `birthday`) VALUE (?)";
    
        const values = [
          req.body.username,
          req.body.email,
          hashedPassword,
          req.body.name,
          req.body.gender,
          req.body.birthday,
        ];
    
        db.query(q, [values], (err, data) => {
          if (err) return res.status(500).json(err);
          return res.status(200).json("User has been created.");
        });
      });
};

export const login = (req, res) => {
  const q = "SELECT * FROM users WHERE email = ?";

  db.query(q, [req.body.email], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json("Email not found!");

    const checkPassword = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );

    if (!checkPassword)
      return res.status(400).json("Wrong password or email!");

    const token = jwt.sign({ id: data[0].id }, "secretkey");

    const { password, ...others } = data[0];

    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .json(others);
  });
};

export const logout = (req, res) => {
  res.clearCookie("accessToken",{
    secure:true,
    sameSite:"none"
  }).status(200).json("User has been logged out.")
};
