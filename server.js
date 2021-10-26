const express=require("express");
const app=express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.listen(3000,()=>{
    console.log("started");
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
con.query("use iolx", function (err, result) {
    if (err) throw err;
    console.log("Database connected");
  });
var products=[];
var name="";
var id="";
app.use(express.static("public"))
app.get("/",function(req,res){
    // console.log(__dirname)
    res.render("home",{name:name,id:id});
})
app.get("/sell",function(req,res){
    res.render("sell",{name:name,id:id});
})
app.get("/form",function(req,res){
    res.render("sellForm",{name:name,id:id,products:products});
})
app.post("/form",function(req,res){
    console.log(req.body);
    var name=req.body.title;
    var desc=req.body.desc;
    var price=req.body.price;
    var pic=req.body.pic;
    values={name,desc,price,id};
    products.push(values);
    res.render("sellForm",{name:name,id:id,products:products});
})
app.get("/register",function(req,res){
    res.sendFile(__dirname+"/frontend/Registration.html");
})
app.post("/register",function(req,res){
    
    var name=req.body.name;
    var mobile=req.body.mobile_no;
    var email=req.body.email;
    var address=req.body.address;
    var password=req.body.password;
    if(name==""|| mobile=="" || email==""||address==""|| password==""){
        console.log("Incomplete form");
        res.redirect("/register");
    }
    else{
        var value=[[name,email,address,mobile,password]]
        con.query("SELECT * from user where email=?",[email],function (err, result, fields){
            if(err) throw err;
            if(result.length==0){
                var q="INSERT INTO user (name, email,address,phoneNo,password) VALUES ?";
                con.query(q,[value],function (err) {
                if (err) {throw err;}
                console.log("success");
                res.redirect("/");
                })
            }
            else{
                console.log(result);
                console.log("email already in use");
                res.redirect("/register");
            }
        })
    }
   
})
app.get("/login",function(req,res){
    res.sendFile(__dirname+"/frontend/login.html");
})
app.post("/login",function(req,res){
    var email=req.body.email;
    var password=req.body.password;
    con.query("SELECT * from user where email=? AND password=?",[email,password],function(err,result){
        if(err) throw err;
        if(result.length==1){
            console.log("success");
            name=result[0].name;
            id=result[0].id;
            res.render("home",{name:name,id:id});
        }
        else{
            console.log("invalid");
            res.redirect("/login")
        }
    })
})
