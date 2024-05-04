import express from 'express'
import cors from 'cors'
import multer from 'multer'
import {v4 as uuidv4} from 'uuid'
import path from 'path'
import fs from 'fs'
import {exec} from 'child_process'

const app=express()

//multer middleware
const storage=multer.diskStorage({
    destination:function(req,file,cb){
       cb(null,"./uploads")
    },
    filename: function(req,file,cb){
        cb(null,file.fieldname+"-"+uuidv4()+path.extname(file.originalname))
    }
})

//multer configuration

const upload=multer({storage:storage})

app.use(
 cors({
    origin:["localhost:3000","localhost:8000"],
    credentials:true
 })
)
app.use(express.json())
app.use(express.urlencoded({extended:true}));
app.use("/uploads",express.static("uploads"))
app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*")
    res.header("Access-Control-Allow-Origin",
    "Origin,X-Requested-With,Content-Type,Accept")

    next()
})

app.get('/', function(req,res){
    res.json({message:"Hello Harry"})
})

app.post("/upload",upload.single('file'),function(req,res){
    console.log("File uploaded successfully")
    const lessonId=uuidv4()
    const videoPath=req.file.path
    const outputPath=`./uploads/courses/${lessonId}`
    const hlsPath=`${outputPath}/index.m3u8`
    console.log("hlspath",hlsPath)

    if(!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath,{recursive:true})
    }
    const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}

    `;
    
      // no queue because of POC, not to be used in production
      exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
          console.log(`exec error: ${error}`)
        }
        console.log(`stdout: ${stdout}`)
        console.log(`stderr: ${stderr}`)
        const videoUrl = `http://localhost:8000/uploads/courses/${lessonId}/index.m3u8`;
    
        res.json({
          message: "Video converted to HLS format",
          videoUrl: videoUrl,
          lessonId: lessonId
        })
      })
})

app.listen(8000,function(){
    console.log("App is listening on port 8000.....")
})