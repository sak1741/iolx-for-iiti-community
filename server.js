const { json } = require("body-parser");
const e = require("express");
const express=require("express");

const multer  = require('multer')

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public");
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, `files/admin-${file.fieldname}-${Date.now()}.${ext}`);
    },
});
const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "jpeg") {
      cb(null, true);
    } else {
        console.log(file.mimetype.split("/")[1])
      cb(new Error("Not a jpeg File!!"), false);
    }
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});
const app=express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
http.listen(port,()=>{
    console.log("Server online");
})
app.set('view engine', 'ejs');
const mysql=require("mysql2");
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "t3stf!le"
  });
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});
con.query("use olx", function (err, result) {
    if (err) throw err;
    console.log("Database connected");
});
var products=[];
var fname="";
var id=0;
function addProduct(product,filename){
    con.query("INSERT INTO listing (productName,original,sellingPrice,details,sellerID) VALUES ?",[product],function(err,result){
        con.query("INSERT INTO product_image(path,listingID) VALUES ?",[[[filename,result.insertId]]],function(error,result){
            if (err) throw err;
        })
    })
}
function deleteProduct(productName,price,id){
    console.log("b");
    con.query("DELETE from listing WHERE productName=? AND sellerID=? AND price=? ",[productName,id,price],function(err,result){
        if(err) throw err;
    })
}
app.use(express.static("public"))
app.get("/",function(req,res){
    res.render("home",{name:fname,id:id});
})
app.get("/sell",function(req,res){
    res.render("sell",{name:fname,id:id});
})
app.get("/form",function(req,res){
    res.render("sellForm",{name:fname,id:id,products:products});
})
app.post("/form",upload.single('pic'), function(req,res){
    var n=req.body.title;
    var desc=req.body.desc;
    var price=req.body.price;
    var oprice=req.body.oprice;
    if(id==0){
        console.log("not logged in");
        res.redirect("/login")
    }
    else{
        if(req.body.add=="Add"){
            var filename=req.file.filename.substring(6);
            var product=[[n,price,oprice,desc,id]];
            values={"name":n,"price":price,"oprice":oprice,"userId":id,"sellerName":fname};
            products.push(values);
            addProduct(product,filename);
        }
        else if(req.body.done!=""){
            var n=req.body.delete;
            deleteProduct(products[n].name,products[n].price,products[n].userId);
            products.splice(n);
        }   
        else{
            res.redirect("/buy")
        }
        res.render("sellForm",{name:fname,id:id,products:products});
    }
})
app.get("/register",function(req,res){
    if(id!=0){
        res.render("home",{id:0,name:""})
    }
    res.render("register",{msg:"Registration"});
})
app.post("/register",function(req,res){
    fname=req.body.fname;
    var sname=req.body.sname;
    var mobile=req.body.mobile_no;
    var email=req.body.email;
    var address=req.body.address;
    var password=req.body.password;
    if(fname==""||sname==""|| mobile=="" || email==""||address==""|| password==""){
        res.render("register",{msg:"Incomplete form"})
    }
    else{
        var value=[[fname,sname, email,address,mobile,password]]
        con.query("SELECT * from user where email=?",[email],function (err, result, fields){
            if(err) throw err;
            if(result.length==0){
                var q="INSERT INTO user (fName,sName, email,address,phoneNo,password) VALUES ?";
                con.query(q,[value],function (err) {
                if (err) {throw err;}
                console.log("success");
                res.redirect("/");
                })
            }
            else{
                res.render("register",{msg:"Email already in use"});
            }
        })
    }
   
})
app.get("/login",function(req,res){
    res.render("login",{msg:"Login"});
})
app.post("/login",function(req,res){
    var email=req.body.email;
    var password=req.body.password;
    con.query("SELECT * from user where email=? AND password=?",[email,password],function(err,result){
        if(err) throw err;
        if(result.length==1){
            fname=result[0].fName;
            id=result[0].id;
            res.render("home",{name:fname,id:id,products:products});
        }
        else{
            res.render("login",{msg:"Email and password don't match"})
        }
    })
})
app.get("/buy",function(req,res){
    var all=[];
    con.query("SELECT *FROM listing INNER JOIN user ON listing.sellerID=user.id INNER JOIN product_image ON listing.listingID=product_image.listingID;",function(err,result){
        if(err) throw err;
        all=result;
        res.render("buyer",{all:all,name:fname,id:id});
    })
})
app.post("/buy",function(req,res){
    if(id==0){
        console.log("not logged in");
        res.redirect("/login")
    }
    else if(req.body.chat=="1"){
        console.log("chat");
        res.redirect('/chat');
    }
    else{
        var item=req.body.wish;
        con.query("INSERT INTO wishlist(listingId,userId) VALUES?",[[[item,id]]],function(err,result){
            if (err) throw err;
        });
    }
})
app.get("/profile",(req,res)=>{
    if(id) {
        con.query("SELECT * from user WHERE id=?", [id], (err, userResult) => {
            console.log(userResult);
            con.query("SELECT * from listing INNER JOIN wishlist ON wishlist.listingId=listing.listingID INNER JOIN user on user.id=?",[id],function(req,result){
                con.query("SELECT * from listing INNER JOIN user ON user.id=listing.sellerID ",function(err,resu){
                    res.render("profile",{name:fname,id:id,user:userResult,wish:result,sell:resu});
                })
            })
        })  
    }
    else {
        res.redirect("/login");
    }
});

app.post("/profile",function(req,res){
    req.app.set('product', req.body.sold);
    res.redirect("/sold");
})
app.get("/sold",function(req,res){
    req.app.set('product',req.app.get('product'));
    res.render("sold");
})
app.post("/sold",function(req,res){
    var product=req.app.get('product');
    var email=req.body.email;
    con.query("SELECT id from user where email=?",email,function(err,res){
        if(err) throw "no user exists";
        console.log(res);
        console.log(product);
        con.query("UPDATE listing SET buyerID=? WHERE listingID=?",[[res[0].id],[product]],function(err,res){
            if(err) throw err;
            console.log(res);
        })
    })
})
app.get("/chat",function(req,res){
    // req.app.set('product',req.app.get('product'));
    res.render("chat");
})

io.on('connection', (socket) => {
    socket.on('chat message', msg => {
      io.emit('chat message', msg);
    });
  });

app.get("/contact",function(req,res){
    // res.sendFile(__dirname+"/contact.html");
    res.render("contact", {name:fname, id:id});
});

app.post("/contact",function(req,res){
    let password=req.body.password
    let email=req.body.email;
    let subject=req.body.subject;
    let text=req.body.text;
    console.log(req.body);
    let transporter=nodemailer.createTransport({
        service:"hotmail",
        auth: {
            user:email,
            pass:password
        }
    });
 
    const options = {
        from:email,
        to:"cse200001041@iiti.ac.in",
        subject:req.body.subject,
        text:req.body.text
    };

    transporter.sendMail(options, function(err,info){
        if(err) {
            console.log(err);
            res.send("Error Try again")
        }
        else {
            console.log("Sent:"+info.response);
            res.send("Email sent");
        }
    });
 
});
