class TextEditor {
    constructor (editorId, db) {
        this.editor = document.querySelector(editorId)
        this.lastSave = document.querySelector('#last-save')
        this.fileList = document.querySelector('#file-list')
        this.newFileButton = document.querySelector('#new')
        this.menuToggle = document.querySelector('#menu-toggle')
        this.menuContainer = document.querySelector('.menu-background')
        this.fileName = document.querySelector('#file-name')
        this.fileMessage = document.querySelector('#file-message')
        this.contentWrapper = document.querySelector('.content-wrapper')
        this.showDeletedFilesToggle = document.querySelector('#show-deleted')
        this.bindUI()

        this.files = []
        this.deletedFiles = []
        this.openFile = null
        this.db = db
        this.init()

        if (window.DEBUG) {
            window.c = () => {
                localforage.clear()
                this.files = []
                this.fileList.innerHTML = ''
                editor.value = ''

                this.showDeletedFilesToggle.checked = false
                this.showDeletedFilesToggle.parentElement.classList.add('hidden')
                this.listFiles(this.files)
            }

            window.a = () => {
                localforage.iterate((v, k) => console.info(v.length, k, v))
            }
        }
    }

    init () {
        this.showDeletedFilesToggle.checked = false
        this.db.config({
            name: 'Tab Typer',
            storeName: 'tab_typer',
            description: 'A simple text editor for your browser.'
        })

        this.db.getItem('files')
            .then(files => {
                if (files && files.length) {
                    console.info(`Loaded ${files.length} files: `, files)
                    this.files = files
                }

                return this.files
            })
            .then(files => this.listFiles(files))
            .then(files => this.showLastEdited(files))
            .catch(this.handleError)

        this.db.getItem('deletedFiles')
            .then(files => {
                if (files && files.length) {
                    console.info(`Loaded ${files.length} deleted files.`)
                    this.deletedFiles = files
                    this.showDeletedFilesToggle.parentElement.classList.remove('hidden')
                }
                return this.deletedFiles
            })
            .catch(this.handleError)
    }

    createFile (name = 'Untitled') {
        const date = new Date()
        return {
            name,
            content: '',
            // TODO: Save files with only the unix timestamp, the string can be retrieved when needed.
            // store in `lastSave` to clarify meaning of the timestamp.
            lastSave: date.toLocaleTimeString(),
            time: date.getTime(),
            id: Helpers.uuidv4()
        }
    }

    listFiles (files, showDeleted = false) {
        if (showDeleted && files.length) {
            this.fileMessage.innerHTML = 'These are your deleted files. Use the button on each file to restore it.'
            this.fileList.innerHTML = files.map(f => `<li class="btn deleted-file" data-id="${f.id}">${f.name} <button class="btn">Restore</button></li>`).join('')
        } else {
            const message = files.length ? 'Select a file to open it. Or <a href="javascript:;">create a new one</a>.' : `Looks like you have no files yet. <a href="javascript:;">Create one</a>.`
            this.fileList.innerHTML = files.map(f => `<li class="btn" data-id="${f.id}">${f.name} <button class="btn delete" title="Delete">X</button></li>`).join('')
            this.fileMessage.innerHTML = message
        }
        for (const b of this.fileList.querySelectorAll('button')) {
            if (showDeleted) {
                b.addEventListener('click', event => this.restoreFile(event))
            } else {
                b.addEventListener('click', event => this.deleteFile(event))
            }
        }

        return files
    }

    deleteFile (event) {
        // http://alistapart.com/article/neveruseawarning
        const id = event.target.parentElement.dataset.id
        const file = this.files.find(f => f.id === id)
        if (file) {
            this.files = this.files.filter(f => f.id !== id)
            this.deletedFiles.push(file)
            this.listFiles(this.files)
            this.showDeletedFilesToggle.parentElement.classList.remove('hidden')
            this.saveAllFiles()
        }
    }

    restoreFile (event) {
        const id = event.target.parentElement.dataset.id
        const file = this.deletedFiles.find(f => f.id === id)
        if (file) {
            this.deletedFiles = this.deletedFiles.filter(f => f.id !== id)
            this.files.push(file)

            this.openFile = file
            this.showFile(file)
            this.saveAllFiles()

            if (this.deletedFiles.length) {
                this.listFiles(this.deletedFiles, true)
            } else {
                this.listFiles(this.files)
                this.showDeletedFilesToggle.parentElement.classList.add('hidden')
                this.showDeletedFilesToggle.checked = false
            }
        }
    }

    showFile (file) {
        if (file) {
            this.fileName.value = file.name
            this.editor.value = file.content
            this.lastSave.innerText = this.getSaveTimeString(file.lastSave)
        }
    }

    getLastEdited (files) {
        if (files.length) {
            return files.reduce((lastEdited, file) => {
                if (file.time > lastEdited.time) return file
                return lastEdited
            })
        }

        return null
    }

    showLastEdited (files) {
        if (files) {
            const lastEdited = this.getLastEdited(files)
            this.showFile(lastEdited)
            this.openFile = lastEdited
        }
    }

    saveAllFiles () {
        const date = new Date()
        const files = this.files.map(f => {
            if (f === this.openFile) {
                f.name = this.fileName.value || 'Untitled'
                f.content = this.editor.value,
                f.lastSave = date.toLocaleTimeString(),
                f.time = date.getTime()
            }
            return f
        })

        const savedFiles = this.db.setItem('files', files)
                                .then(files => this.updateSaveTime(files))
        const deletedFiles = this.db.setItem('deletedFiles', this.deletedFiles)
        return Promise.all([savedFiles, deletedFiles]).catch(this.handleError)
    }

    updateSaveTime (files) {
        this.lastSave.innerText = this.getSaveTimeString(this.openFile.lastSave)
        return files
    }

    getSaveTimeString (time) {
        return 'Saved ' + time
    }

    handleError (error) {
        console.error(error)
    }

    updateEditorHeight () {
        // Make editor content fit without a scrollbar.
        this.editor.style.height = '1px'
        this.editor.style.height = this.editor.scrollHeight + 2 + 'px'
    }

    selectFile (event) {
        const hasDeleteButton = event.target.lastChild.classList && event.target.lastChild.classList.contains('delete')
        if (event.target.tagName === 'LI' && hasDeleteButton) {
            // Only allow regular files to be edited - avoid any deleted.
            this.openFile = this.files.find(f => f.id === event.target.dataset.id)
            this.showFile(this.openFile)
            this.toggleMenu()
        }
    }

    addNewFile () {
        // NOTE: There may be some data loss here if the user creates a new file,
        // before the current open one has been saved.
        // IDEA: Maybe solve this with a timeout? Or just make better use of the promises?
        this.files.push(this.createFile())
        this.openFile = this.getLastEdited(this.files)
        this.showFile(this.openFile)
        this.listFiles(this.files)
        this.saveAllFiles()

        if (!this.menuContainer.classList.contains('hidden')) {
            this.toggleMenu()
        }

        this.editor.focus()
    }

    toggleMenu () {
        if (this.menuContainer.classList.contains('hidden')) {
            // Refresh file list when menu is shown.
            this.listFiles(this.files)

            if (this.deletedFiles.length) {
                this.showDeletedFilesToggle.parentElement.classList.remove('hidden')
            }
        }

        this.contentWrapper.classList.toggle('no-scroll')
        this.menuContainer.classList.toggle('hidden')
        this.menuContainer.scrollTop = 0
    }

    toggleFileListType (showDeleted) {
        if (showDeleted && this.deletedFiles.length) {
            this.listFiles(this.deletedFiles, true)
        } else {
            this.listFiles(this.files)
        }
    }

    bindUI () {
        // Save 2 seconds after the user stops typing.
        this.editor.addEventListener('input', Helpers.debounce(() => this.saveAllFiles(), 1000))

        this.editor.addEventListener('input', Helpers.preventScroll(this.editor, this.updateEditorHeight.bind(this)))
        this.updateEditorHeight()

        Helpers.throttle('resize', 'optimizedResize')
        window.addEventListener('optimizedResize', event => this.updateEditorHeight())

        this.editor.placeholder = `Hey there!\n\nThis is a simple, offline-first text editor for your browser. Files are saved automatically as you type, and stored locally on your device.\n\nPress ESC to quickly toggle the menu, where you can manage all your files.\n\n\nEnjoy!\n// Samuel`
        this.editor.focus()

        // if (window.DEBUG === true) {
        //     // Save before tab is closed.
        //     window.addEventListener('beforeunload', async () => {
        //         // This might work, in order to force the browser to wait for a completed save.
        //         const res = await this.saveAllFiles()
        //         return
        //     })
        // }

        this.newFileButton.addEventListener('click', () => this.addNewFile())

        this.fileList.addEventListener('click', event => this.selectFile(event))

        this.menuToggle.addEventListener('click', event => this.toggleMenu())
        this.fileMessage.addEventListener('click', event => {
            if (event.target.tagName === 'A') {
                this.addNewFile()
            }
        })

        this.showDeletedFilesToggle.addEventListener('change', event => this.toggleFileListType(event.target.checked))

        // Select the whole filename for quick editing.
        this.fileName.addEventListener('focus', e => e.target.select())
        this.fileName.addEventListener('input', Helpers.debounce(() => this.saveAllFiles(), 1000))

        window.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                this.toggleMenu()
            }
        })
    }
}
