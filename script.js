let client_id = '9ccebc57069a49eeaa3d29d18b8efd92'
let client_secret = '04395979bc074dbb8f603e347b56ce2e'
let redirect_uri = 'http://localhost:5000'

async function getCurrentSong(access_token) {
    let myHeaders = new Headers()
    myHeaders.append('Accept', 'application/json')
	  myHeaders.append('Content-Type', 'application/json')
	  myHeaders.append('Authorization', 'Bearer ' + access_token)

	  const player = await fetch('https://api.spotify.com/v1/me/player/currently-playing?market=ES', {
        method: 'GET',
		    headers: myHeaders
	  })
		    .then(response => response.json())
		    .then(data => {
            if (data.error) if(data.error.status === 401) throw new Error('We think the token has expired. Getting a new one...')
            return data
        })
		    .catch(e => {
            console.error(e)
            refreshAccessToken()
        })

	  const currentSong = {
		    name: player.item.name,
		    artist: player.item.artists[0].name,
        duration_ms: player.item.duration_ms,
        progress_ms: player.progress_ms
	  }

	  return currentSong
}

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";

function onPageLoad() {
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else{
        let access_token = localStorage.getItem('access_token')
        if (!access_token){
            requestAuthorization()
        } else {
            
        }
    }
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization(){
    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-currently-playing";
    window.location.href = url; // Show Spotify's authorization screen
}

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            localStorage.setItem('access_token', data.access_token)
            localStorage.setItem('expires_in', data.expires_in)
        }
        if ( data.refresh_token  != undefined ){
            localStorage.setItem('refresh_token', data.refresh_token)
        }
        onPageLoad();
    } else if (this.status == 401) {
        refreshAccessToken()
    } else console.log(this.responseText)
}

onPageLoad()
