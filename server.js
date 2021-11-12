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
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.listen(3000,()=>{
    console.log("Server online");
})
app.set('view engine', 'ejs');
const mysql=require("mysql2");
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "PSALG@2020"
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
    res.render("sellForm",{name:fname,id:id,products:products});})
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
            console.log(result);
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
    console.log(req.body);
})
