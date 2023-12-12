var express = require('express');
var router = express.Router();
const postsModel = require('./posts');
const usersModel = require('./users');
const passport = require('passport');
const localStrategy = require("passport-local");
const upload = require('./multer');

passport.use(new localStrategy(usersModel.authenticate()))
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login',function(req,res){
  res.render('login',{error:req.flash('error')});
})

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

router.get('/feedback',async (req,res)=>{
  const post = await postsModel.find().populate('user')
  const title = 'Profile';
  const href  = '/profile'
  console.log(post)
  res.render('feedback',{ post,user:req.user,title,href})
})

router.post('/fileupload',isLoggedIn,upload.single('image'), async(req,res)=>{
  const user = await usersModel.findOne({username:req.session.passport.user})
  user.profileImg = req.file.filename;
  console.log()
  await user.save()
  res.redirect('/profile')
})
router.get('/profile',isLoggedIn ,async function(req, res, next) {
  const user = await usersModel.findOne({
    username: req.session.passport.user
  })
  .populate('posts')
  const title = 'Feedback';
  const href  = '/feedback'
  res.render('profile',{user,title,href})
});

router.post('/upload', isLoggedIn ,upload.single('file'),async(req,res)=>{
  if(!req.file){
   return res.status(400).send('no files were uploaded...')
  }
  const user = await usersModel
  .findOne({
   username:req.session.passport.user
   })
  const post = await postsModel.create({
   image: req.file.filename,
   imageText:req.body.filecaption,
   user: user._id
  })
  user.posts.push(post._id)
  await user.save();
  res.redirect('/profile')
 })
 
router.get('/download',isLoggedIn ,async function(req, res, next) {
  const user = await usersModel.findOne({
    username: req.session.passport.user
  })
  .populate('posts');
   const downloadfile = 'H:/ONLINE WORKINH/Programming Lectures/Web Development/Practical/Back ENd/Projects/pinterestClone/public/images/uploads/'+user.posts[0].image;

  res.download(downloadfile)
});


router.post('/login',passport.authenticate("local",
{
  successRedirect:"/profile",
  failureRedirect:"/login",
  failureFlash:true,

}),function(req,res){
  
})

router.post('/register',(req,res)=>{
  const { username, email, fullname } = req.body;
  const userData = new usersModel({ username, email, fullname });

  usersModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect('/profile')
    })
  })

})

router.get('/delete/post:id',isLoggedIn ,async (req, res) => {
  const postId = await postsModel.findOne({_id:req.params.id})
  try {
    // Find and remove the post by ID
    const deletedPost = await postsModel.findByIdAndDelete(postId);
    res.redirect('/profile')
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) {
    return next()
    
  };
  res.redirect('/');


}


module.exports = router;
