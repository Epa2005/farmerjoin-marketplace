const connection = require('./dbConnection.js');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;
app.use(express.json());
app.use(cors())
app.post('/create_account', (req, res) => {

    const { username, email, phone, password, role, locat } = req.body;
    connection.query('select * from users where full_name=?'
        , [username], (err, results) => {
            if (err) {
                console.error('query error', err);
            }
            else if (results.length > 0) {
                res.json({ msg: ' already exist! try another!' });
            }
            else {
                const { username, email, phone, password, role, location } = req.body;
                connection.query('insert into users(full_name,email,phone,password,role,created_at) VALUES(?,?,?,?,?,?)',
                    [username, email, phone, password, role, location], (err, results) => {
                        if (err) {
                            console.error('queryerror', err);

                        }
                        else {
                            res.json({ msg: 'welcome! your account created succesfuly!' });
                        }
                    });
            }
        });
});


app.post('/buyers', (req, res) => {

    const { campany_name, location } = req.body;
    connection.query('insert into buyers(company_name,location) VALUES(?,?) JOIN users ON buyers.buyer_id=users.user_id',
        [campany_name, location], (err, results) => {
            if (err) {
                console.error('queryerror', err);

            }
            else {
                res.json({ msg: 'welcome! your account created succesfuly!' });
            }
        });

});
app.get('/users', (req, res) => {
    connection.query("select* from user", (err, results) => {
        if (err) console.error(err);
        return res.json(results);

    });
});
app.delete('/delete/:id', (req, results) => {
    connection.query('delete from user where u_id=?', [id], (err, result) => {
        if (err) throw err;
        else {
            res.json({ message: 'deleted succseful!' })
        }
    });
});



app.use((req, res) => {
    res.status(404).json({ error: 'invalid API' });
});
app.listen(port, () => {
    console.log(`server runing on port${port}`);
});

