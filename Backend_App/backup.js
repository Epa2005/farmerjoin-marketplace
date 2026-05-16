const user=results[0];
req.session.user=user.username;
res.json({message:'are you sure you want to update?',user:req.session.user});
