export function create_object(nameObject) {
    const objectInfo = { nameObject: nameObject };
    send_request('create_object', 'POST', JSON.stringify(objectInfo));
}

export function delete_object(nameObject) {
    const objectInfo = { nameObject: nameObject };
    send_request('delete_object', 'DELETE', JSON.stringify(objectInfo));
}

export function rename_object(oldName, newName) {
    const nameData = { oldName: oldName, newName: newName };

    const getExtension = (filename) => {
        return filename.slice((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
    };

    const extOld = getExtension(oldName);
    const extNew = getExtension(newName);

    if (extOld !== extNew && (extOld || extNew)) {
        if (confirm(`Расширение(.${extOld}) файла будет изменено`)) {
            send_request('rename_object', 'PATCH', JSON.stringify(nameData));
        }
    } else {
        send_request('rename_object', 'PATCH', JSON.stringify(nameData));
    }
}

export function download_object(nameObject) {
    const path = new URL(document.location.toString()).searchParams.get("path") || "";

    const params = new URLSearchParams();
    params.append('path', path);
    params.append('nameObject', nameObject);
    window.location.href = `/download_object/?${params.toString()}`
}

export function upload_object(files) {
    const formData = new FormData();

    for (const file of files) {
        formData.append("fileList", file);
        if (file.webkitRelativePath) {
            formData.append("filePaths", file.webkitRelativePath);
        }
    }

    send_request('upload_object', 'POST', formData);
}

function send_request(url, method, data) {
    const params = new URL(document.location.toString()).searchParams;

    fetch(`/${url}/?${params}`, {
        method: method,
        headers: {
            'X-CSRFToken': document.querySelector("[name=csrfmiddlewaretoken]").value
        },
        body: data
    }).then((response) => {
        if (response.ok) {
            location.reload();
        } else if (response.status == 409) {
            alert("Объект с таким именем уже существует");
        }
        else if (response.status == 400) {
            alert("Ошибка в имени файла");
        }
        else {
            alert("Невозможно выполнить действие");
        }
    }).catch((error) => {
        console.error("Ошибка сети:", error);
    });
}

// Helper function to get CSRF token
export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Share file functionality
export function initShareButtons() {
    console.log('Initializing share buttons functionality');
    
    try {
        // Check if the share modal exists
        const shareModal = document.getElementById('shareModal');
        if (!shareModal) {
            console.error('Share modal element not found!');
            return;
        }
        
        // Check if the share submit button exists
        const shareSubmitBtn = document.getElementById('shareSubmitBtn');
        if (!shareSubmitBtn) {
            console.error('Share submit button not found!');
            return;
        }
        
        // Set up the share submit button click handler
        shareSubmitBtn.addEventListener('click', function() {
            console.log('Share submit button clicked');
            
            const objectName = this.dataset.objectName;
            console.log('Object name to share:', objectName);
            
            const username = document.getElementById('shareUsername').value.trim();
            console.log('Username to share with:', username);
            
            const errorElement = document.getElementById('shareError');
            const successElement = document.getElementById('shareSuccess');
            
            // Reset messages
            errorElement.style.display = 'none';
            successElement.style.display = 'none';
            
            if (!username) {
                errorElement.textContent = 'Пожалуйста, введите имя пользователя';
                errorElement.style.display = 'block';
                return;
            }
            
            // Get the current path from the URL
            const urlParams = new URLSearchParams(window.location.search);
            const path = urlParams.get('path') || '';
            
            // Get CSRF token from the form
            const csrfTokenElement = document.querySelector('#shareForm [name=csrfmiddlewaretoken]');
            if (!csrfTokenElement) {
                console.error('CSRF token element not found!');
                errorElement.textContent = 'Ошибка безопасности: не найден CSRF токен';
                errorElement.style.display = 'block';
                return;
            }
            
            const csrfToken = csrfTokenElement.value;
            console.log('CSRF token found:', csrfToken ? 'Yes' : 'No');
            
            // Send the share request
            console.log(`Sending share request: ${objectName} with ${username}, path: ${path}`);
            
            fetch(`/share_file/?path=${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    nameObject: objectName,
                    username: username
                })
            })
            .then(response => {
                console.log('Share response status:', response.status);
                
                if (response.ok) {
                    successElement.style.display = 'block';
                    document.getElementById('shareUsername').value = '';
                    return;
                }
                
                return response.json().then(data => {
                    console.error('Error response data:', data);
                    throw new Error(data.error || 'Произошла ошибка при отправке файла');
                });
            })
            .catch(error => {
                console.error('Share request error:', error);
                errorElement.textContent = error.message;
                errorElement.style.display = 'block';
            });
        });
        
        console.log('Share functionality initialized successfully');
    } catch (error) {
        console.error('Error setting up share functionality:', error);
    }
}