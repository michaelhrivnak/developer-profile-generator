const inquirer = require('inquirer');
const fs = require('fs');
const axios = require('axios');
const generateHTML = require("./assets/js/generateHTML.js");
const util = require('util');
const Puppeteer = require('puppeteer');  


const writeFileAsync = util.promisify(fs.writeFile);

const questions = [
    {
        type:"input",
        message:"What is the GitHub Username you would like to use?",
        name:"username"
    },
    {
        type:"input",
        message:"What colour would you like to use for the cards? [green,blue,pink,red]",
        name:"colour"
    }
];

async function writeToFile(fileName, data) {
    
    try{
        let pdfPage = await pdf(data);
        writeFileAsync(fileName,pdfPage).then(err =>{
            if(err){
                console.log(`write failed: ${err}`);
            }
            console.log("success");
        });
    }catch (error){
        console.log(error);
    }

    // pdf.create(data).toFile(fileName, function(err, res) {
    //     if (err) return console.log(err);
    //     console.log(res); // { filename: '/app/businesscard.pdf' }
    // });
    
    // writeFileAsync(fileName,data,"binary").then(err=>{
    //     if(err){
    //         console.log(err);
    //     }
    //     console.log("success");
    // });
    
    //(fileName,JSON.stringify(data),'binary');
}

function init() {  
    let colour ="";
    inquirer
    .prompt(questions)
    .then( answers => {
        
        const {username} = answers;
        colour = answers.colour;
        if (generateHTML.colors.hasOwnProperty(colour)){       
            const queryUrl = `https://api.github.com/users/${username}`
            return axios.get(queryUrl);
        }else{
            throw Error("not a valid colour");
        }
        //return {result: axious.get(queryUrl), colour: colour}
    })        
    .then( ({data}) =>{
        const {html_url} = data;
        const {name} = data;
        const {location} = data;
        const {public_repos} = data;
        const {followers} = data;
        const {avatar_url} = data;
        const {blog} = data;
        const {following} = data;
        const {company} = data;
        const {bio} = data;
        const htmlData = {
            url: html_url,
            color: colour,
            name: name,
            location: location,
            repos: public_repos,
            followers: followers,
            following: following,
            pic: avatar_url,
            blog: blog,
            company: company,
            bio: bio,
            stars: 120 //figure out stars?
        }
        const htmlpage = generateHTML.generateHTML(htmlData);

        writeToFile('test.pdf',htmlpage);
       
    })
    .catch(err =>{
        console.log(err);
    });
}

async function pdf(html) {   
    
    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    //await page.goto('data:text/html;charset=UTF-8,' + html, {waitUntil: 'networkidle0'});
    await page.emulateMedia("screen");
    await page.screenshot({ path: 'output.png' });
    const pdf = await page.pdf();
    browser.close();
    return pdf
}

init();
