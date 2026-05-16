const connection=require('./dbConnection.js');
const express= require ('express');
const session=require('express-session');
const bcrypt=require('bcrypt');
const app=express();
app.use(session({
    secret:'student',resave:false,saveUninitialized:false
}));
const port=5000;
app.use(express.json());
app.post('/create_account', (req,res) => {
    
    const {username}=req.body;
    connection.query('select * from users where username=?',[username],(err,results)=>{
if(err){
    console.error('query error',err);
}
else if(results.length>0){
    res.json({message:' already exist! try another!'});
}
else{
    const {username,password}=req.body;
    if(!username || !password){
        res.json({message:'username and password is required!'});
    }
    bcrypt.hash(password,10,(err,hashedpassword)=>{
if(err) throw err;
else{
    connection.query('insert into users (username,password) values(?,?)',[username,hashedpassword],(err,results)=>{
        if(err){
            console.error('queryerror',err);
        
        }   
        else{
            res.json({message:'welcome! your account created succesfuly!'});
        }
        });
}
    });

}
    });
}); 


app.post('/login',(req,res)=>{
    const {username,password}=req.body;
    connection.query('select * from users where username=?',[username],(err,result)=>{
        if(err) throw err;
        if(result.length===0){
            res.json({message:'User not found!'});
        }
        else{
            const  user=result[0];

            bcrypt.compare(password,user.password,(err,ismach)=>{
                if(err) throw err;
                if(ismach){
                req.session.user=user.username;
                res.json({message:'User logged in!',user:req.session.user});
            } 
            else{
                res.json({message:'Invalid password'});
            }
        });
        }
    });
});
app.get('/dashboard',(req,res)=>{
const {username}=req.body;
connection.query('select * from users where username=?',[username],(err,result)=>{
if(err) throw err;
else{
    const user=result[0];
    req.session.user=user.username;

    res.json({message:'session created!',user:req.session.user});
  
}
});
});
app.post('/logout',(req,res)=>{
   req.session.destroy((err)=>{
if(err){
     res.json({message:'logout failed!'})
}
else{
    res.json({message:'loged out!'})
}
   });
      
});

app.put("/forgot_password",(req,res) => {
    const {username}=req.body;

connection.query("select * from  users where username=?",[username],(err,results)=>{
    if(err){
        console.error('query error',err);
    }
    else if(results.length === 0){
        res.json('account not found');
    }
    else{
        
        res.json({message:'now enter-name!!'});
        app.put('/enter-your-password',(req,res)=>{
            const {username,password}=req.body;
        bcrypt.hash(password,10,(err,hashedpassword)=>{

        connection.query("update users set password=? where username=?",[hashedpassword,username],(err,results)=>{
            if(err){
                console.error('update is error',err);
                
            }
            else{
                res.json({msg:' password updated!'});

            }
        });});
        });
    }
   
});
});

app.delete('/api/items/:id', async (req, res) => {
    try {
        const id = req.params.id;
        connection.query('DELETE FROM users where id=?',[id],(err,results)=>{
            if(err){
                console.error('query error!',err);
            }
            else if(results.length === 0){
                res.json('no data found');
            }
            else{
                res.status(200).json({ message: 'Item deleted successfully' });
            }
        });//ogic to delete the item from your database based on itemId
        // e.g., await Item.deleteOne({ _id: itemId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});