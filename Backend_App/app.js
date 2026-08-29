const connection=require('./dbConnection.js');
const express= require ('express');
const cors=require('cors');
const path = require('path');
const bcrypt=require('bcryptjs');
const uploadRoutes = require('./routes/uploads');
const productRoutes = require('./routes/products');
const farmerRoutes = require('./routes/farmers');
const authRoutes = require('./routes/auth');
const cooperativeRoutes = require('./routes/cooperatives');
const app=express();
const port=4000;
app.use(express.json());
app.use(cors())

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use upload routes
app.use('/api', uploadRoutes);

// Use auth routes
app.use('/auth', authRoutes);

// Use product and farmer routes
app.use('/products', productRoutes);
app.use('/farmers', farmerRoutes);

// Use cooperative routes
app.use('/cooperative', cooperativeRoutes);

app.post('/create_account',(req,res) => {
    
    const {username}=req.body;
    connection.query('select * from users where username=?',[username],(err,results)=>{
if(err){
    console.error('query error',err);
}
else if(results.length>0){
    res.json({msg:' already exist! try another!'});
}
else{
    const {username,password}=req.body;
connection.query('insert into users (username,password) values(?,?)',[username,password],(err,results)=>{
if(err){
    console.error('queryerror',err);

}   
else{
    res.json({msg:'welcome! your account created succesfuly!'});
}
});
}
    });
});

// Fixed login endpoint with email and bcrypt
app.post('/login', async (req,res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    connection.query("select * from users where email=?", [email], async (err,results)=>{
        if(err){
            console.error('query error',err);
            return res.status(500).json({ message: 'Database error' });
        }
        else if(results.length === 0){
            return res.status(404).json({ message: 'User not found' });
        }
        else{ 
            const user = results[0];
            
            try {
                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    return res.status(401).json({ message: 'Invalid password' });
                }
                
                res.json({ 
                    message: 'Login successful',
                    user: {
                        user_id: user.user_id,
                        full_name: user.full_name,
                        email: user.email,
                        role: user.role
                    }
                });
            } catch (compareError) {
                console.error('Password comparison error:', compareError);
                return res.status(500).json({ message: 'Authentication error' });
            }
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
            const {username,password}=req.body;

            connection.query("update users set password=? where username=?",[password,username],(err,results)=>{
                if(err){
                    console.error('update is error',err);
                }
                else{
                    res.json({msg:' is arlead updated!'});
    
                }
            });
        }
       
    });
});

app.get('/users',(req,res)=>{
    connection.query("select* from users",(err,results)=>{
        if(err) console.error(err);
        return res.json(results);

    });
});

app.delete('/delete/:id',(req,res)=>{
    const {id} = req.params;
    connection.query('delete from users where id=?',[id],(err,result)=>{
        if(err) throw err;
        else{
            res.json({message:'deleted succseful!'})
        }
    });
});

app.use((req,res)=>{
    res.status(404).json({ error:'invalid API'});
});

app.listen(port,()=>{
    console.log(`server runing on port${port}`);
});
