let boxTable = document.getElementById('box-table'),
    tableHeader = document.getElementById('table-header'),
    tableCars = document.getElementById('table-cars'),
    tableParkedCars = document.getElementById('table-parked-cars'),
    tableTitle = document.getElementById('table-title'),
    btnAnotherTable = document.getElementById('btn-another-table'),
    carStatusManagerForm = document.getElementById('car-status-manager-form'),
    tablesWrapper = document.getElementById('tables-wrapper'),
    tableWrapperCars = document.getElementById('table-wrapper-cars'),
    tableWrapperParkedCars = document.getElementById('table-wrapper-parked-cars'),
    btnScroll = document.getElementById('btn-scroll'),
    wrapperForms = document.getElementById('wrapper-forms'),
    clientForm = document.getElementById('client-form'),
    errorBox = document.getElementById('error-box'),
    editLayer = document.getElementById('edit-layer'),
    formEdit = document.getElementById('form-edit'),
    clientSelect = document.getElementById('client-select'),
    carSelect = document.getElementById('car-select'),
    btnChangeCarStatus = document.getElementById('btn-change-car-status'),
    url = (new URL(document.location)),
    params = url.searchParams,
    page = url.pathname.slice(1).split('.')[0],
    backUrl = '../back/lib.php',
    flagNewForm = false,
    newCar = false,
    blockCreateBtns,
    clientId,
    delayHideError,
    selClientId,
    paginationBtns
    

// Проверка подключения к бд
window.onload = () => {
    $.ajax({
        url: backUrl,
        type: 'post',
        data: {request: 'checkConnectDB'},
        success: (data) => {
            data = JSON.parse(data)

            if (data['result'] == false) {
                return error(data['error'])
            } else {
                pagePreparation()
            }
        }
    })
}

// Подгрузка информации на страницу
function pagePreparation() {
    if (page == 'edit') {
        clientId = params.get('id')
        newCar = params.get('new_car')

        // Загрузка и отрисовка форм клиента и его машин
        loadClientInformation()
    } else if (page == 'index' || page == '') {
        // Загрузка и отрисовка списка всех машин
        loadCarsInformation()

        // Загрузка и отрисовка списка припаркованных машин
        loadCarsInformation('parked')

        // Загрузка списка клиентов для смены состояния авто 
        loadClientList()
    }
}

// Добавляет форму для добавление ещё одной машины
function addFormNewCar() {
    let col = document.createElement('div'),
        form = document.createElement('div'),
        title = document.createElement('span'),
        formBody = document.createElement('div'),
        inputBrand = document.createElement('input'),
        inputModel = document.createElement('input'),
        inputColor = document.createElement('input'),
        inputNumber = document.createElement('input')

    col.classList = 'col-12 col-md-6 col-lg-4'
    form.classList = 'form new-form'
    title.classList = 'form-title'
    title.innerText = 'Данные о машине'
    formBody.classList = 'form-body d-grid'
    inputBrand.name = 'brand'
    inputBrand.type = "text"
    inputBrand.placeholder = 'Марка'
    inputModel.name = 'model'
    inputModel.type = "text"
    inputModel.placeholder = 'Модель'
    inputColor.name = 'color'
    inputColor.type = "text"
    inputColor.placeholder = 'Цвет'
    inputNumber.name = 'number'
    inputNumber.type = "text"
    inputNumber.placeholder = 'Гос номер'

    formBody.append(inputBrand, inputModel, inputColor, inputNumber)
    form.append(title, formBody)
    col.appendChild(form)

    wrapperForms.insertBefore(col, blockCreateBtns)
}

// Преборазовывает форму с полями в форму с текстом
function transformationForm(id) {
    let form = document.querySelector('.new-form'),
        formBody = form.childNodes[1],
        btnEdit = document.createElement('div'),
        btnDelete = document.createElement('div'),
        btnParkIt = document.createElement('div'),
        boxImgBtnParkIt = document.createElement('div'),
        frontBtnParkIt = document.createElement('div'),
        backBtnParkIt = document.createElement('div')

    form.classList.remove('new-form')

    form.firstChild.innerText = 'Авто'
    
    btnParkIt.classList = 'btn-park-it parked c-p'
    btnParkIt.setAttribute('onclick', 'changeCarParkingStatus(' + id + ', this)')
    boxImgBtnParkIt.classList = 'box-img-btn-park-it'
    frontBtnParkIt.classList = 'front-btn-park-it'
    backBtnParkIt.classList = 'back-btn-park-it'

    boxImgBtnParkIt.append(frontBtnParkIt, backBtnParkIt)
    btnParkIt.appendChild(boxImgBtnParkIt)
    form.insertBefore(btnParkIt, form.childNodes[1])


    btnEdit.classList = 'btn-edit-form'
    btnEdit.innerHTML = '<i class="fa fa-pencil" aria-hidden="true"></i>'
    btnEdit.setAttribute('onclick', "showEditForm('car', " + id + ", this)")

    btnDelete.classList = 'btn-delete-form'
    btnDelete.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'
    btnDelete.setAttribute('onclick', 'deleteCar(' + id + ', this)')

    form.append(btnEdit, btnDelete)

    formBody.childNodes.forEach(input => {
        let property = document.createElement('div')  

        property.classList = 'info-about'
        property.innerText = input.value

        formBody.insertBefore(property, input)

        input.remove()
    })
}

// Собирает и "валидирует" данные с форм на странице
function collectData(par, mode) {
    let car = [],
        suffix
    mode == 'edit' ? suffix = '-edit' : suffix = ''


    // Поля формы машины
    if (par != 'new-car' && par != 'client' && par != 'car' &&
        !document.querySelector('[name="brand"]').value &&
        !document.querySelector('[name="model"]').value &&
        !document.querySelector('[name="color"]').value &&
        !document.querySelector('[name="number"]').value) 
    {
        return 1 // если поля в новой форме пеустые, то игнорить их  
    }
    if (par != 'client') {
        if (document.querySelector('[name="brand'+suffix+'"]').value.length > 1) {
            car.push(document.querySelector('[name="brand'+suffix+'"]').value)
        } else {
            return error('Недопустимая длинна поля ' + document.querySelector('[name="brand'+suffix+'"]').placeholder)
        }
        if (document.querySelector('[name="model'+suffix+'"]').value.length > 0) {
            car.push(document.querySelector('[name="model'+suffix+'"]').value)
        } else {
            return error('Недопустимая длинна поля ' + document.querySelector('[name="model'+suffix+'"]').placeholder)
        }
        if (document.querySelector('[name="color'+suffix+'"]').value.length > 1) {
            car.push(document.querySelector('[name="color'+suffix+'"]').value)
        } else {
            return error('Недопустимая длинна поля ' + document.querySelector('[name="color'+suffix+'"]').placeholder)
        }
        if (document.querySelector('[name="number'+suffix+'"]').value.length > 5) {
            car.push(document.querySelector('[name="number'+suffix+'"]').value)
        } else {
            return error('Недопустимая длинна поля ' + document.querySelector('[name="number'+suffix+'"]').placeholder)
        }
    }

    // Поля формы клиента
    if (clientForm || par == 'client') {
        let client = []

        if (document.querySelector('[name="full-name'+suffix+'"]').value.length > 2) {
            client.push(document.querySelector('[name="full-name'+suffix+'"]').value)
        } else {
            return error('Недопустимая длинна поля ' + document.querySelector('[name="full-name'+suffix+'"]').placeholder)
        }
        if (document.querySelector('[name="phone-number'+suffix+'"]').value.length > 8) {
            client.push(document.querySelector('[name="phone-number'+suffix+'"]').value)
        } else {
            return error('Недопустимая длинна поля Телефон')
        }
        client.push(document.querySelector('[name="address'+suffix+'"]').value)
        document.getElementsByName('gender'+suffix).forEach(btn => {
            btn.checked && (client.push(btn.value))
        })

        if (mode == 'edit')
            return client

        return [client, car]
    }

    return car
}

// Отправляет запрос на добавления нового клиента и его машин
function addNewClient(par) {
    let clientCarData = collectData()

    if(clientCarData != 0) {
        $.ajax({
            url: backUrl,
            method: 'post',
            data: {request: 'addNewClient', client: clientCarData[0], car: clientCarData[1]},
            success: (data) => {
                data = JSON.parse(data)

                if(data['result'] == false) {
                    error(data['error'])
                } else {
                    if (par == 'end' && page == 'create') {
                        window.location.replace('index.html')
                    } else if (par == 'new-car') {
                        window.location.replace('edit.html?id='+ data['client_id'] + '&new_car=true')
                    } 
                }
            }
        })
    }
}

// Запрос на получение данных о клиенте и его машинах (edit page)
function loadClientInformation() {
    $.ajax({
        url: backUrl,
        type: 'post',
        data: {request: 'loadClientInformation', clientId: clientId},
        success: (data) => {
            data = JSON.parse(data)

            if (data['result'] == true) {
                wrapperForms.innerHTML = ''

                createClientForm(data['client'])
                
                data['cars'].forEach(car => {
                    createCarForm(car)
                })

                createBlockBtns()
                
                if (newCar == 'true') {
                    flagNewForm = true
                    addFormNewCar()
                }
            } else {
                error(data['error'])
            }
        }
    })
}

// Создаёт форму с информацией о клиенте
function createClientForm(data) {
    let col = document.createElement('div'),
        form = document.createElement('div'),
        formTitle = document.createElement('span'),
        formBody = document.createElement('div'),
        fullName = document.createElement('div'),
        phoneNumber = document.createElement('div'),
        address = document.createElement('div'),
        gender = document.createElement('div'),
        btnEdit = document.createElement('div'),
        btnDelete = document.createElement('div')    

    col.classList = 'col-12 col-md-6 col-lg-4'    
    form.classList = 'form client-form'
    form.setAttribute('data', data['id'])
    formTitle.classList = 'form-title'
    formTitle.innerText = 'Клиент'
    formBody.classList = 'form-body'
    fullName.classList = 'info-about'
    fullName.innerText = data['full_name']
    phoneNumber.classList = 'info-about'
    phoneNumber.innerText = data['phone_number']
    address.classList = 'info-about'
    address.innerText = data['address']
    gender.classList = 'info-about'
    gender.innerText = data['gender'] == 0 ? 'Ж' : 'М'
    btnEdit.classList = 'btn-edit-form'
    btnEdit.innerHTML = '<i class="fa fa-pencil" aria-hidden="true"></i>'
    btnEdit.setAttribute('onclick', "showEditForm('client', " + data['id'] + ", this)")
    btnDelete.classList = 'btn-delete-form'
    btnDelete.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'
    btnDelete.setAttribute('onclick', 'deleteClient()')

    formBody.append(fullName, phoneNumber, address, gender)
    form.append(formTitle, formBody, btnDelete, btnEdit)
    col.appendChild(form)

    wrapperForms.appendChild(col)
}

// Создаёт форму с информацией о машине
function createCarForm(data) {
    let col = document.createElement('div'),
        form = document.createElement('div'),
        formTitle = document.createElement('span'),
        btnParkIt = document.createElement('div'),
        boxImgBtnParkIt = document.createElement('div'),
        frontBtnParkIt = document.createElement('div'),
        backBtnParkIt = document.createElement('div'),
        formBody = document.createElement('div'),
        brand = document.createElement('div'),
        model = document.createElement('div'),
        color = document.createElement('div'),
        number = document.createElement('div'),
        btnEdit = document.createElement('div'),
        btnDelete = document.createElement('div')            

    col.classList = 'col-12 col-md-6 col-lg-4'    
    form.classList = 'form car-form'
    form.setAttribute('data', data['id'])
    formTitle.classList = 'form-title'
    formTitle.innerText = 'Авто'

    btnParkIt.classList = 'btn-park-it c-p'
    btnParkIt.setAttribute('onclick', 'changeCarParkingStatus(' + data['id'] + ', this)')
    boxImgBtnParkIt.classList = 'box-img-btn-park-it'

    if (data['status'] == 1) {
        boxImgBtnParkIt.style.transform = 'rotateY(180deg)'
        btnParkIt.classList.add('parked')
    }
    frontBtnParkIt.classList = 'front-btn-park-it'
    backBtnParkIt.classList = 'back-btn-park-it'

    formBody.classList = 'form-body'
    brand.classList = 'info-about'
    brand.innerText = data['brand']
    model.classList = 'info-about'
    model.innerText = data['model']
    color.classList = 'info-about'
    color.innerText = data['color']
    number.classList = 'info-about'
    number.innerText = data['number']
    btnEdit.classList = 'btn-edit-form'
    btnEdit.innerHTML = '<i class="fa fa-pencil" aria-hidden="true"></i>'
    btnEdit.setAttribute('onclick', "showEditForm('car', " + data['id'] + ", this)")
    btnDelete.classList = 'btn-delete-form'
    btnDelete.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'
    btnDelete.setAttribute('onclick', 'deleteCar(' + data['id'] + ', this)')


    boxImgBtnParkIt.append(frontBtnParkIt, backBtnParkIt)
    btnParkIt.appendChild(boxImgBtnParkIt)
    formBody.append(brand, model, color, number)
    form.append(formTitle, btnParkIt, formBody, btnEdit, btnDelete)
    col.appendChild(form)

    wrapperForms.appendChild(col)
}

// Создаёт кнопки 'Добавить машину' и 'Готово'
function createBlockBtns() {
    let col = document.createElement('div'),
        fBtn = document.createElement('div'),
        sBtn = document.createElement('div'),
        fText = document.createElement('span'),
        sText = document.createElement('span')

    col.classList = 'col-12 col-md-6 col-lg-4'
    col.id = 'block-create-btns'
    fBtn.classList = 'form btn-form c-p'
    fBtn.setAttribute('onclick', "addNewCar('new-car')")
    sBtn.classList = 'form btn-form c-p'
    sBtn.setAttribute('onclick', "addNewCar('end')")
    fText.classList = 'form-title'
    fText.innerHTML = 'Добавить машину <i class="fa fa-plus" aria-hidden="true">'
    sText.classList = 'form-title'
    sText.innerHTML = 'Готово <i class="fa fa-check" aria-hidden="true"></i>'

    fBtn.appendChild(fText)
    sBtn.appendChild(sText)
    col.appendChild(fBtn)
    col.appendChild(sBtn)

    wrapperForms.appendChild(col)

    blockCreateBtns = document.getElementById('block-create-btns')
}

// Показывает форму для редактирования
function showEditForm(par, id, e) {
    if (editLayer.classList.contains('d-none')) {
        editLayer.classList.remove('d-none')
        
        formEdit.innerHTML = ''

        let elementsOriginalForm = e.parentNode.childNodes,
            formTitle = document.createElement('span'), 
            btnClose = document.createElement('div'),
            btnApply = document.createElement('div'),
            formBody = document.createElement('div')

        formTitle.classList = 'form-title'
        formTitle.innerText = elementsOriginalForm[0].innerText

        btnClose.classList = 'btn-close-edit-form'
        btnClose.setAttribute('onclick', 'showEditForm()')
        btnClose.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'

        formBody.classList = 'form-body'

        if (par == 'client') {
            let fullName = document.createElement('input'),
                phoneNumber = document.createElement('input'),
                address = document.createElement('input'),
                gender = document.createElement('div'),
                spanM = document.createElement('span'),
                spanF = document.createElement('span'),
                radioM = document.createElement('input'),
                radioF = document.createElement('input')

            fullName.classList = 'info-about'
            fullName.type = 'text'
            fullName.name = 'full-name-edit'
            fullName.placeholder = 'ФИО'
            fullName.value = elementsOriginalForm[1].childNodes[0].innerText

            phoneNumber.classList = 'info-about'
            phoneNumber.type = 'text'
            phoneNumber.name = 'phone-number-edit'
            phoneNumber.placeholder = 'Телефон'
            phoneNumber.value = elementsOriginalForm[1].childNodes[1].innerText

            address.classList = 'info-about'
            address.type = 'text'
            address.name = 'address-edit'
            address.placeholder = 'Адрес'
            address.value = elementsOriginalForm[1].childNodes[2].innerText

            gender.classList = 'd-flex justify-content-center pt-4 bn-2'
            spanM.innerText = 'М'
            spanF.innerText = 'Ж'
            radioM.classList = 'mr-3'
            radioM.type = 'radio'
            radioM.name = 'gender-edit'
            radioM.value = 1
            radioF.type = 'radio'
            radioF.name = 'gender-edit'
            radioF.value = 0

            elementsOriginalForm[1].childNodes[3].innerText == 'М' ? radioM.setAttribute('checked', '') : radioF.setAttribute('checked', '')
            
            gender.append(spanM, radioM, spanF, radioF)
            formBody.append(fullName, phoneNumber, address, gender)
        } else if (par == 'car') {
            let brand = document.createElement('input'),
                model = document.createElement('input'),
                color = document.createElement('input'),
                number = document.createElement('input')

            brand.classList = 'info-about'
            brand.type = 'text'
            brand.name = 'brand-edit'
            brand.placeholder = 'Марка'
            brand.value = elementsOriginalForm[2].childNodes[0].innerText

            model.classList = 'info-about'
            model.type = 'text'
            model.name = 'model-edit'
            model.placeholder = 'Модель'
            model.value = elementsOriginalForm[2].childNodes[1].innerText

            color.classList = 'info-about'
            color.type = 'text'
            color.name = 'color-edit'
            color.placeholder = 'Цвет'
            color.value = elementsOriginalForm[2].childNodes[2].innerText

            number.classList = 'info-about'
            number.type = 'text'
            number.name = 'number-edit'
            number.placeholder = 'Гос номер'
            number.value = elementsOriginalForm[2].childNodes[3].innerText

            formBody.appendChild(brand)
            formBody.appendChild(model)
            formBody.appendChild(color)
            formBody.appendChild(number)
        } else {
            error('Неверный параметр: ' + par)
        }
        
        btnApply.classList = 'text-center c-p'
        btnApply.setAttribute('onclick', "updateData('"+ par +"', "+ id +")")
        btnApply.innerText = 'Готово'

        formEdit.append(formTitle, btnClose, formBody, btnApply)
    } else {
        editLayer.classList.add('d-none')
    }
}

// Обновить данные о клиенте / машине на странице
function updatePageData(par, id, data) {
    let form = document.querySelector('.'+par+'-form[data="'+id+'"]'),
        formBodyElements

    formBodyElements = par == 'client' ? form.childNodes[1].childNodes : form.childNodes[2].childNodes

    formBodyElements.forEach((elem, idx) => {
        elem.innerText = data[idx]
        if (par == 'client' && idx == 3) {
            data[idx] == 1 ? formBodyElements[3].innerText = 'М' : formBodyElements[3].innerText = 'Ж'
        }
    })
}

// Обновить данные о клиенте / машине в БД
function updateData(par, id) {
    newData = collectData(par, 'edit') // mode: edit - поиск данных в форме редактирования
    
    if (newData != 0)
    $.ajax({
        url: backUrl,
        type: 'post',
        data: {request: 'updateData', par: par, id: id, data: newData},
        success: (data) => {
            data = JSON.parse(data)

            if (data['result'] == true) {
                showEditForm()
                updatePageData(par, id, newData)
            } else {
                error(data['error'])
            }
        }
    })
}

// Запрос на изменение статуса машины (на парковке / отсутствует)
function changeCarParkingStatus(id, e) {
    $.ajax({
        url: backUrl,
        type: 'post',
        data: {request: 'changeCarParkingStatus', carId: id},
        success: (data) => {
            data = JSON.parse(data)

            if (data['result'] == true) {
                if (page == 'edit') {
                    if (e.classList.contains('parked')) {
                        e.classList.remove('parked')
                        e.childNodes[0].style.transform = 'rotateY(0deg)'
                    } else {
                        e.classList.add('parked')
                        e.childNodes[0].style.transform = 'rotateY(180deg)'
                    }
                } else {
                    data['status'] == 0 ? 
                        btnChangeCarStatus.value = 'Припарковать' :
                        btnChangeCarStatus.value = 'Убрать'

                    // Обновить список машин на стоянке
                    loadCarsInformation('parked')

                    // Обновить список машин клиента
                    loadCarList(selClientId)

                    // Скрыт кнопку 
                    btnChangeCarStatus.classList.add('d-none')
                }
            } else {
                error(data['error'])
            }
        }
    })
}

// Добавление машины 
function addNewCar(par) {
    if (par == 'end' && flagNewForm == false) {
        window.location.replace('index.html')
    } else if (par == 'end' && flagNewForm == true) {
        let carData = collectData()

        if (carData == 1) {
            window.location.replace('index.html')
        } else {
            uploadNewCar(carData, par)
            flagNewForm = false
        }
    } else if (par == 'new-car' && flagNewForm == false) {
        flagNewForm = true
        addFormNewCar()
    } else if (par == 'new-car' && flagNewForm == true) {
        let carData = collectData(par)
        if (carData != 0) 
            uploadNewCar(carData, par)
    }
}

// Отправляет запрос на добавление новой машины
function uploadNewCar(car, par) {
    $.ajax({
        url: backUrl,
        type: 'post',
        data: {request: 'addNewCar', car: car, clientId: clientId},
        success: (data) => {
            data = JSON.parse(data)

            if (data['result'] == true) {
                if (par == 'end') {
                    // window.location.replace('index.html')
                    transformationForm(data['id'])
                } else if (par == 'new-car') {
                    transformationForm(data['id'])
                    addFormNewCar()
                } else {
                    error('Неверный параметр: ' + par)
                }
            } else {
                error(data['error'])
            }
        }
    })
}

// Показывает сколько машин на стоянке
function showNumberParkedCars(quantity) {
    let number = quantity,
        lastNumeral = number.toString().slice(-1),
        word

    if (lastNumeral == 1 && number != 11) {
        word = 'машина'
    } else if (
        number != 12 && number != 13 && number != 14 &&
        (lastNumeral == 2 || lastNumeral == 3 || lastNumeral == 4)
    ) {
        word = 'машины'
    } else {
        word = 'машин'
    }

    document.getElementById('number-parked-cars').innerText = number + ' ' + word
}

// Меняет таблицу все клиенты / парковка
function showAnotherTable() {
    let temp = tableTitle.innerText

    if (tablesWrapper.classList.contains('parking')) {
        tablesWrapper.classList.remove('parking')
        tablesWrapper.style.left = 0

        tableTitle.innerText = btnAnotherTable.innerText
        btnAnotherTable.innerHTML = temp + '<i class="fa fa-arrow-right ml-2" aria-hidden="true"></i>'

        carStatusManagerForm.classList.add('d-none')
        
        boxTable.style.height = tableHeader.scrollHeight + tableWrapperCars.scrollHeight + 32 + 'px'
    } else {
        tablesWrapper.classList.add('parking')
        tablesWrapper.style.left = 'calc(-100% - 1rem)'

        tableTitle.innerText = btnAnotherTable.innerText
        btnAnotherTable.innerHTML = temp + '<i class="fa fa-arrow-left ml-2" aria-hidden="true"></i>'

        carStatusManagerForm.classList.remove('d-none')

        boxTable.style.height = tableHeader.scrollHeight + tableWrapperParkedCars.scrollHeight + 32 + 'px'
    }
}

// Запрос на получение данных о всех клиентах и их машинах
function loadCarsInformation(par, id = 0, page = '') {
    $.ajax({
        url: backUrl,
        type: 'post',
        data: {request: 'loadCarsInformation', par: par, carId: id, page: page},
        success: (data) => {
            data = JSON.parse(data)

            if (data['result'] == true && data['page'] != 'last') {
                if (par != 'parked') {
                    tableCars.innerHTML = ''

                    data['list_car'].forEach(elem => {
                        tableCars.appendChild(createRowCar(elem))
                    })
                } else {
                    tableParkedCars.innerHTML = ''

                    data['list_car'].forEach(elem => {
                        tableParkedCars.appendChild(createRowCar(elem))
                    })

                    showNumberParkedCars(data['quantity'])
                }

                if (data['list_car'].length > 0)
                pagination(data['quantity'], data['list_car'][0]['id'],
                    data['list_car'][data['list_car'].length - 1]['id'], par)
            } else if (data['result'] == false) {
                error(data['error'])
            }
        }
    })
}

// Создаёт строки строки с информацией о клиенте и его машине
function createRowCar(data) {
    let tr = document.createElement('tr'),
        fullName = document.createElement('td'),
        car = document.createElement('td'),
        number = document.createElement('td'),
        tdEdit = document.createElement('td'),
        btnEdit = document.createElement('a'),
        btnDelete = document.createElement('td')

    fullName.classList = 'full-name'
    fullName.innerText = data['full_name']
    car.classList = 'car'
    car.innerText = data['brand'] + ' ' + data['model']
    number.classList = 'car-number'
    number.innerText = data['number']
    tdEdit.classList = 'btn-edit text-center'
    btnEdit.innerHTML = '<i class="fa fa-pencil" aria-hidden="true"></i>'
    btnEdit.setAttribute('href', 'edit.html?id=' + data['client_id'])
    btnDelete.classList = 'btn-delete text-center'
    btnDelete.setAttribute('onclick', 'deleteCar(' + data['id'] + ')')
    btnDelete.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>'

    tdEdit.appendChild(btnEdit)

    tr.append(fullName, car, number, tdEdit, btnDelete)

    return tr
}

// Запрос на получение списка всех клиентов 
function loadClientList() {
    $.ajax({
        url: backUrl,
        type: 'post',
        data: {request: 'loadClientList'},
        success: (data) => {
            data = JSON.parse(data)

            if (data['result'] == true) {
                clientSelect.innerHTML = ''
                clientSelect.appendChild(document.createElement('option'))
                
                data['list_client'].forEach(elem => {
                    clientSelect.appendChild(addOptionsSelect(elem, 'client'))
                })
                
                clientSelect.addEventListener('change', function (e) {
                    loadCarList(e.target.value)
                })
            } else {
                error(data['error'])
            }
        }
    })
}

// Запрос на получение списка машин всех клиентов
function loadCarList(id) {
    if(!id) {
        carSelect.innerHTML = ''
    } else {
        $.ajax({
            url: backUrl,
            type: 'post',
            data: {request: 'loadCarList', clientId: id},
            success: (data) => {
                data = JSON.parse(data)

                if (data['result'] == true) {
                    carSelect.innerHTML = ''
                    carSelect.appendChild(document.createElement('option'))

                    data['list_car'].forEach(elem => {
                        carSelect.appendChild(addOptionsSelect(elem, 'car'))
                    })

                    carSelect.addEventListener('change', function (e) {
                        createBtnChangeStatusCar(e.target.value, id)
                    })

                    selClientId = id
                } else {
                    error(data['error'])
                }
            }
        })
    }
}

// Добавляет варианты в выпадающий список
function addOptionsSelect(data, par) {
    let option = document.createElement('option')

    if (par == 'client') {
        option.innerText = data['full_name']
        option.value = data['id']
    } else {
        option.innerText = data['brand'] + ' ' + data['number']
        option.value = data['id'] + '.' + data['status']
    }

    return option
}

// Создаёт кнопку для обновления статуса машины припаркована / нет
function createBtnChangeStatusCar(data, id) {
    data = data.split('.')

    data[1] == 0 ? 
        btnChangeCarStatus.value = 'Припарковать' :
        btnChangeCarStatus.value = 'Убрать'
    
    btnChangeCarStatus.setAttribute('onclick', 'changeCarParkingStatus('+ data[0] +')')

    btnChangeCarStatus.classList.remove('d-none')
}

// Отправляет запрос на удаление машины
function deleteCar(id, e) {
    $.ajax({
        url: backUrl,
        type: 'post',
        data: {request: 'deleteCar', carId: id},
        success: (data) => {
            data = JSON.parse(data)

            if (data['result'] == true) {
                if (page == 'index' || page == '') {
                    loadCarsInformation()
                    
                    // Обновить список машин на стоянке
                    loadCarsInformation('parked')

                    // Обновить список клиентов
                    loadClientList()

                    // Очистить список машин
                    loadCarList(id)

                    // Скрыт кнопку 
                    btnChangeCarStatus.classList.add('d-none')    
                } else {
                    if (data['client_status'] == 0) {
                        window.location.replace('index.html')
                    }

                    e.parentNode.parentNode.remove()
                }
                       
            } else {
                error(data['error'])
            }
        }
    })
}

// Отправляет запрос на удаление клиента
function deleteClient() {
    $.ajax({
        url: backUrl,
        type: 'post',
        data: {request: 'deleteClient', clientId: clientId},
        success: (data) => {
            data = JSON.parse(data)

            if (data['result'] == true) {
                window.location.replace('index.html')
            } else if (data['rwsult'] == false) {
                error(data['error'])
            }
        }
    })
}

// пагинация в таблице на главной
function pagination(quantity, fid, lid , par) {
    if (quantity > 20) {
        if (par == 'parked') {
            if (!document.getElementById('parkedPagination')) {
                tableWrapperParkedCars.appendChild(createBtnsPaginations(fid, lid, par))
            } else {
                document.getElementById('prevPageParked').
                    setAttribute('onclick', "loadCarsInformation('"+ par +"',"+ fid+", 'prev')")
                document.getElementById('nextPageParked').
                    setAttribute('onclick', "loadCarsInformation('"+ par +"',"+ lid+"), 'next'")
            }
        } else {
            if (!document.getElementById('carPagination')) {
                tableWrapperCars.appendChild(createBtnsPaginations(fid, lid, par)) 
            } else {
                document.getElementById('prevPage').
                    setAttribute('onclick', "loadCarsInformation('"+ par +"',"+ fid+", 'prev')")
                document.getElementById('nextPage').
                    setAttribute('onclick', "loadCarsInformation('"+ par +"',"+ lid+"), 'next'")
            }
        }
    }
    if (quantity <= 20) {
        if (document.getElementById('carPagination') && 
            !tablesWrapper.classList.contains('parking') && 
            par != 'parked') 
        {
            document.getElementById('carPagination').remove()
            document.getElementById('parkedPagination').remove()
        }
        
        if (document.getElementById('parkedPagination') && 
        tablesWrapper.classList.contains('parking') && 
        par == 'parked') 
        {
            document.getElementById('parkedPagination').remove()
        }  
    }
    if (tablesWrapper.classList.contains('parking')) {
        boxTable.style.height = tableHeader.scrollHeight + tableWrapperParkedCars.scrollHeight + 32 + 'px'
    } else {
        boxTable.style.height = tableHeader.scrollHeight + tableWrapperCars.scrollHeight + 32 + 'px'
    }
}

// Создание кнопок
function createBtnsPaginations(fid, lid, par) {
    let btns = document.createElement('div'),
        previousPage = document.createElement('div'),
        nextPage = document.createElement('div') 

    btns.classList = 'd-flex w-max m-auto px-3 pt-3' 
    if (par == 'parked') {
        btns.id = 'parkedPagination'
        previousPage.id = 'prevPageParked'
        nextPage.id = 'nextPageParked'
    } else {
        btns.id = 'carPagination'
        previousPage.id = 'prevPage'
        nextPage.id = 'nextPage'
    }

    previousPage.innerHTML = '<i class="fa fa-arrow-left c-p" aria-hidden="true">'
    previousPage.setAttribute('onclick', "loadCarsInformation('"+ par +"',"+ fid +", 'prev')")
    nextPage.innerHTML = '<i class="fa fa-arrow-right ml-3 c-p" aria-hidden="true">'
    nextPage.setAttribute('onclick', "loadCarsInformation('"+ par +"',"+ lid +"), 'next'")

    btns.append(previousPage, nextPage)

    return btns
}

// Плашка ошибки 
function error(text, e) {
    if (e && e.id == 'error-box') {
        hideError()
    } else {
        errorBox.classList.remove('d-none')
        errorBox.innerHTML = text + ' ' + '<i class="fa fa-times" aria-hidden="true"></i>'

        clearInterval(delayHideError)
        delayHideError = setInterval(() => {
            hideError()
        }, 4000)
    }

    return 0
}
// Скрыть ошибку
function hideError() {
    clearInterval(delayHideError)
    errorBox.classList.add('d-none')
}