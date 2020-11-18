let username 
let socket = io()

const textarea = document.querySelector('#textarea')
const submitBtn = document.querySelector('#submitBtn')
const commentBox = document.querySelector('.comment__box')
const loginTxt = document.querySelector('.logintxt')

submitBtn.addEventListener('click', (e) => {
    doComment(e)
})
login(false)

function doComment(e) {
    e.preventDefault()
    let comment = textarea.value
    if(!comment) {
        return
    }
    postComment(comment)
}

function login(ask)
{
    username = localStorage.getItem('username')
    if (!username && ask) {
        username = prompt('Please enter your name: ')
        if (username) {
            localStorage.setItem('username', username)
        }
    }
    if(username)
    {
        loginTxt.innerHTML = `You are logged in as ${username}. <a href="#" onclick="logout();">Logout.</a>`
    }
    else
    {
        loginTxt.innerText = ''
    }
}

function logout()
{
    username = false
    localStorage.removeItem('username')
    login(false)
}

function postComment(comment) {
    // Append to dom
    login(true)
    if(!username) return;

    let data = {
        username: username,
        comment: comment
    }
    appendToDom(data)
    textarea.value = ''
    // Broadcast
    broadcastComment(data)
    // Sync with Mongo Db
    syncWithDb(data)

}

function appendToDom(data) {
    let lTag = document.createElement('li')
    lTag.classList.add('comment', 'mb-3')

    let markup = `
                        <div class="card border-light mb-3">
                            <div class="card-body">
                                <h6>${data.username}</h6>
                                <p>${data.comment}</p>
                                <div>
                                    <img src="/img/clock.png" alt="clock">
                                    <small>${moment(data.time).fromNow()}</small>
                                </div>
                            </div>
                        </div>
    `
    lTag.innerHTML = markup

    commentBox.prepend(lTag)
}

function broadcastComment(data) {
    // Socket
    socket.emit('comment', data)
}

socket.on('comment', (data) => {
    appendToDom(data)
})
let timerId = null
function debounce(func, timer) {
    if(timerId) {
        clearTimeout(timerId)
    }
    timerId = setTimeout(() => {
        func()
    }, timer)
}
let typingDiv = document.querySelector('.typing')
socket.on('typing', (data) => {
    typingDiv.innerText = `${data.username} types...`
    debounce(function() {
        typingDiv.innerText = ''
    }, 1000)
})

// Event listner on textarea
textarea.addEventListener('keyup', (e) => {
    socket.emit('typing', { username })
})

// Send on enter
textarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        doComment(e);
      }
})

// Api calls 

function syncWithDb(data) {
    const headers = {
        'Content-Type': 'application/json'
    }
    fetch('/api/comments', { method: 'Post', body:  JSON.stringify(data), headers})
        .then(response => response.json())
        .then(result => {
            console.log(result)
        })
}

function fetchComments () {
    fetch('/api/comments')
        .then(res => res.json())
        .then(result => {
            result.forEach((comment) => {
                comment.time = comment.createdAt
                appendToDom(comment)
            })
        })
}

window.onload = fetchComments