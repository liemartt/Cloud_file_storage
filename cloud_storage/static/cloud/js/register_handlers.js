import { delete_object, rename_object, create_object, download_object, upload_object, initShareButtons } from './object_actions.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log('register_handlers.js loaded');
    
    // Initialize Bootstrap popovers
    try {
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        console.log('Found ' + popoverTriggerList.length + ' popovers');
        
        // Create popover instances
        const popoverList = [...popoverTriggerList].map(popoverTriggerEl => {
            return new bootstrap.Popover(popoverTriggerEl, {
                html: true,
                sanitize: false,
                trigger: 'click'
            });
        });
        
        // Add event listener to document body for delegation
        document.body.addEventListener('click', function(e) {
            // Handle share button clicks that might be in popovers
            if (e.target && e.target.classList.contains('share-btn')) {
                console.log('Share button clicked via delegation:', e.target.dataset.objectName);
                
                // Hide any open popovers
                popoverList.forEach(popover => {
                    popover.hide();
                });
                
                // Show the share modal
                const objectName = e.target.dataset.objectName;
                const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
                
                // Reset the form
                document.getElementById('shareUsername').value = '';
                document.getElementById('shareError').style.display = 'none';
                document.getElementById('shareSuccess').style.display = 'none';
                
                // Store the object name to be shared
                document.getElementById('shareSubmitBtn').dataset.objectName = objectName;
                
                shareModal.show();
            }
        });
    } catch (error) {
        console.error('Error initializing popovers:', error);
    }
    
    // Initialize share buttons functionality
    try {
        initShareButtons();
        console.log('Share buttons initialized');
    } catch (error) {
        console.error('Error initializing share buttons:', error);
    }
});

/* create */

document.addEventListener("DOMContentLoaded", () => {
    console.log('Setting up create buttons');
    const createFileButton = document.getElementById("create-file-button");
    const createFolderButton = document.getElementById("create-folder-button");

    if (createFileButton) {
        createFileButton.addEventListener("click", () => handleCreateObject("file"));
    }

    if (createFolderButton) {
        createFolderButton.addEventListener("click", () => handleCreateObject("folder"));
    }
});

/* delete */

document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('delete-btn')) {
        const objectName = e.target.getAttribute('data-object-name');
        if (confirm(`Вы уверены, что хотите удалить объект "${objectName}"?`)) {
            delete_object(objectName);
        }
    }
});

/* download */

document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('download-btn')) {
        const objectName = e.target.getAttribute('data-object-name');
        download_object(objectName);
    }
});

/* rename */

document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('rename-btn')) {
        const oldName = e.target.getAttribute('data-object-name');
        const newName = prompt("Введите новое название объекта:", oldName);

        if (newName) {
            const validation = newName.includes('/') ? isValidObjectName(newName.slice(0, -1)) : isValidObjectName(newName);

            if (!validation.valid) {
                alert(validation.message);
            } else {
                rename_object(oldName, newName);
            }
        }
    }
});


function handleCreateObject(type_object) {
    const name_file = prompt("Введите название объекта:", '');
    if (name_file) {
        const validation = isValidObjectName(name_file);
        if (!validation.valid) {
            alert(validation.message);
        } else {
            const objectName = type_object === "folder" ? `${name_file.replace(/^\/+|\/+$/g, '')}/` : name_file;
            create_object(objectName);
        }
    }
}

/* upload */

document.addEventListener("DOMContentLoaded", () => {
    console.log('Setting up upload buttons');
    const uploadFileButton = document.getElementById("upload-file-btn");
    const uploadFolderButton = document.getElementById("upload-folder-btn");

    const oneFileInput = document.getElementById("one-file-picker");
    const manyFileInput = document.getElementById("many-file-picker");

    if (oneFileInput) {
        oneFileInput.addEventListener("change", () => {
            upload_object(oneFileInput.files);
            oneFileInput.value = "";
        });
    }

    if (manyFileInput) {
        manyFileInput.addEventListener("change", () => {
            upload_object(manyFileInput.files);
            manyFileInput.value = "";
        });
    }

    if (uploadFileButton) {
        uploadFileButton.addEventListener("click", function () {
            document.getElementById("one-file-picker").click();
        });
    }

    if (uploadFolderButton) {
        uploadFolderButton.addEventListener("click", function () {
            document.getElementById("many-file-picker").click();
        });
    }
});

function isValidObjectName(name) {
    if (!name) return { valid: false, message: "Имя объекта не может быть пустым" };
    
    const forbiddenChars = /[\\/:*?"<>|%#]/;

    if (name.trim().length === 0) {
        return { valid: false, message: "Имя объекта не может быть пустым" };
    }

    if (name.length > 40) {
        return { valid: false, message: "Имя объекта слишком длинное (макс. 40 символов)" };
    }

    if (forbiddenChars.test(name)) {
        return { valid: false, message: "Имя содержит запрещенные символы: \\ / : * ? \" < > | %" };
    }

    if (/^\/+$/.test(name)) {
        return { valid: false, message: "Недопустимое имя объекта" };
    }

    return { valid: true, message: "OK" };
}