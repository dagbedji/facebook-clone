import express from "express"; //framework for http request and routing
import bodyParser from "body-parser"; //MiddleWare for parsing incoming request to the body (e.g form data)
import multer from "multer"; //MiddleWare for handling files upload
import path from "path"; //Sans ceci on ne peut pas manipuler l'emplacement des fichiers
import { fileURLToPath } from 'url'; // covertis le module import.meta.url a un emplacement de fichier qu'on peut utiliser

const __filename = fileURLToPath(import.meta.url); 
//retourne l'URL du module courant. Cela inclut le chemin d'accès complet au fichier, y compris le protocole (file://).
//En assignant le fichier à la constante filename, cela permet de connaître le chemin absolu du fichier dans lequel ce code est exécuté.
const __dirname = path.dirname(__filename);
//path.dirname : C'est une fonction du module path de Node.js qui retourne le nom du répertoire parent d'un chemin donné.
//__dirname : le chemin du répertoire contenant le fichier courant (ex. : /projet).

const app = express(); //initialise express
const port = 3000; // definis le port sur lequel notre request sera envoyé

let posts = []; //Un array pour stocker les postes.

app.use(express.static("public")); //le dossier public est utiliser pour stocker les fichier static. C'est son middleware
app.use(bodyParser.urlencoded({extended:true})); // Ce middleware est utiliser pour passer les donner qui viennent du formulaire via POST et le rend disponible dans le req.body

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // middleware
//Cette lignes rend le dossier upload accessible en ligne (web), et permet de poster des images dans le browser


//La configuration de multer est essentiel pour indiquer comment les fichier seront sauvegarder
//The Multer configuration sets up how and where files are stored when they are uploaded:
//Essentiel for Storage Location: File Naming, File Size Limit, File Filtering
// destination: indique la ou le fichier doit etre sauvegarder dans l'application
//filename: le nom original du fichier ne change pas

const storage = multer.diskStorage({
  destination: (req, file, cb) =>{
    cb(null, './uploads/');
  },
  filename: (req, file, cb) =>{
    cb(null, file.originalname);
  }
});



//Configuration multer middleware
//The Multer middleware handles the actual parsing of the incoming multipart/form-data requests.
//It processes the request to extract the uploaded files and makes them available in req.file or req.files.
// Il prend en charge: Request Handling,Error Handling,Integration with Express
const upload = multer({
  storage : storage, //utilise la configration precedente pour sauvegarde les fichier
  limits:{fileSize: 5 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase()) //This line checks if the file's extension is one of the allowed types (e.g., .jpeg, .jpg, .png, .gif).
    const mimetype = filetypes.test(file.mimetype); //This line checks if the file's MIME type corresponds to one of the allowed types.

    if (mimetype && extname){
      return cb(null, true);
    }else{
      cb(new Error('Only image files are allowed'))
    }
    }
  }).single('image') //This tells Multer to look for the file in the request body under the field name image.


//Routes
app.get("/", (req,res) =>{
  res.render("index.ejs",{ posts: posts}) // renders the index.ejs and pass the posts array to it.
  //ceci permet d'utiliser le post dans le fichier ejs et d'afficher dans la page web, quand post est une photo, la page web affiche la photo
})

//text post submission
app.post("/submit", (req, res) => {
  const userPost = req.body.post;
  if (userPost && userPost.trim() !== ""){
    posts.push({ type: 'text', content: userPost});
  }
  res.redirect("/");
}); //push the submitted text into the post with te array type text and redirect user back to homepage.

//handle the image file upload
app.post('/upload', (req, res) =>{
  upload(req, res, (err) =>{
    if (err) {
      res.render('index', { message: err.message, posts: posts});

    }else{
      if(!req.file){
        res.render('index', { message: 'No file file selected!', posts: posts});//if error or no file, it render ejs with message error
      }else{ 
        const imageUrl = `/uploads/${req.file.filename}`;
        posts.push({type: 'image', content: imageUrl});
        res.redirect("/")
      }// if no error it construct the image url using the filename and adds it to post array the type "image"
    }
  });
});

// POST route for delete
app.post('/delete', (req, res) => {
  const indexdel = parseInt(req.body.itemId);
  if (!isNaN(indexdel) && indexdel >= 0 && indexdel < posts.length) {
      posts.splice(indexdel, 1);
  }
  res.redirect('/');
});

// POST route for update
app.post('/update', (req, res) => {
  const { itemId, updatedContent } = req.body;
  console.log( "itemid :", itemId);
  console.log( "updatedContent :", updatedContent);
  const index = parseInt(itemId);
  if (!isNaN(index) && index >= 0 && index < posts.length && updatedContent) {
      posts[index].content = updatedContent;
  }
  res.redirect('/');
});

app.listen(port, () =>{
  console.log(`Server is listen on port ${port}`);
});
//server start listening on port 3000

