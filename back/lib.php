<?php
require_once 'connectDB.php';


switch ($_POST['request']) {
    case 'checkConnectDB':
        echo json_encode(checkConnectDB($pdo));
        break;
    case 'loadCarsInformation':
        echo json_encode(loadCarsInformation($pdo, $_POST['par'], $_POST['carId'], $_POST['page']));
        break;
    case 'addNewClient':
        echo json_encode(addNewClient($pdo, $_POST['client'], $_POST['car']));
        break;       
    case 'deleteCar':
        echo json_encode(deleteCar($pdo, $_POST['carId']));
        break;
    case 'countNumberParkedCars':
        echo json_encode(countNumberParkedCars($pdo));
        break; 
    case 'loadClientInformation':
        echo json_encode(loadClientInformation($pdo, $_POST['clientId']));
        break;
    case 'addNewCar':
        echo json_encode(addNewCar($pdo, $_POST['car'], $_POST['clientId']));
        break; 
    case 'deleteClient':
        echo json_encode(deleteClient($pdo, $_POST['clientId']));
        break; 
    case 'updateData':
        echo json_encode(updateData($pdo, $_POST['par'], $_POST['id'], $_POST['data']));
        break;
    case 'changeCarParkingStatus':
        echo json_encode(changeCarParkingStatus($pdo, $_POST['carId']));
        break;
    case 'loadClientList':
        echo json_encode(loadClientList($pdo));
        break;
    case 'loadCarList':
        echo json_encode(loadCarList($pdo, $_POST['clientId']));
        break;
}


// Проверка подключения к бд
function checkConnectDB($pdo) {
    return $pdo;
}

// Загружает список машин
function loadCarsInformation($pdo, $par, $id = 0, $page = '') {
    $output = [];
    
    try {
        $stmt = false;
        if ($par != 'parked') { // таблица всех машин
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM car");
            $stmt->execute();
            
            $output['quantity'] = $stmt->fetch()['COUNT(*)'];

            $stmt = $pdo->prepare("SELECT COUNT(*) as row_number FROM car WHERE id < ?");
            $stmt->execute([$id]);

            $rowNumber = $stmt->fetch()['row_number'];
            if ($rowNumber == 0) 
                $rowNumber = -1;
            
            if ($page == 'prev') { // предыдущя страница
                $rowNumber = $rowNumber > 19 ? $rowNumber - 20 : 0 ;

                $stmt = $pdo->prepare("SELECT *, car.id FROM car 
                    INNER JOIN client ON car.client_id = client.id 
                    ORDER BY car.id LIMIT 20 OFFSET ? 
                ");

                $stmt->execute([$rowNumber]);
            } else if ($page != 'prev' && $output['quantity'] != $rowNumber + 1){
                $stmt = $pdo->prepare("SELECT *, car.id FROM car
                    INNER JOIN client ON car.client_id = client.id 
                    WHERE car.id > ? ORDER BY car.id LIMIT 20
                ");

                $stmt->execute([$id]);
            } else { // конец таблицы в бд
                $output['result'] = true;
                $output['page'] = 'last';
                return $output;
            }
        } else { // таблица припаркованых машин
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM car WHERE status = 1");
            $stmt->execute();

            $output['quantity'] = $stmt->fetch()['COUNT(*)'];

            $stmt = $pdo->prepare("SELECT COUNT(*) as row_number 
                FROM car WHERE id < ? AND status = 1
            ");
            $stmt->execute([$id]);

            $rowNumber = $stmt->fetch()['row_number'];   
            if ($rowNumber == 0) 
                $rowNumber = -1;          
            
            if ($page == 'prev') { // предыдущя страница   
                $rowNumber = $rowNumber > 19 ? $rowNumber - 20 : 0 ;
                
                $stmt = $pdo->prepare("SELECT *, car.id FROM car 
                    INNER JOIN client ON car.client_id = client.id 
                    WHERE status = 1 ORDER BY car.id LIMIT 20 OFFSET ? 
                ");

                $stmt->execute([$rowNumber]);
            } else if ($page != 'prev' && $output['quantity'] != $rowNumber + 1) {
                $stmt = $pdo->prepare("SELECT *, car.id FROM car 
                    INNER JOIN client ON car.client_id = client.id
                    WHERE car.id > ? AND status = 1 ORDER BY car.id LIMIT 20 
                ");

                $stmt->execute([$id]);
            } else { // конец таблицы в бд
                $output['result'] = true;
                $output['page'] = 'last';
                return $output;
            }
        }

        $output['result'] = true;
        $output['list_car'] = $stmt->fetchAll();
    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
    }
    
    return $output;
}

// Валидирует и проверяет на уникальности номера телефона
function checkUniqPhoneNumber($pdo, $phoneNumber, $id = '') {
    $output = [];

    if (preg_match('/^\d{8,10}$/', $phoneNumber) == 1) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM client WHERE phone_number = ?");
            $stmt->execute([$phoneNumber]);

            if ($stmt->fetch()['id'] != $id) {
                $output['result'] = false;
                $output['error'] = 'Такой номер телефона уже существует';
            } else {
                $output['result'] = true;  
            }     
        } catch (Exception $e) {
            $output['result'] = false;
            $output['error'] = $e->getMessage();
        }
    } else {
        $output['result'] = false;
        $output['error'] = 'Недопустимый формат номера телефона';
    }
    
    return $output;
}

// Валидирует и проверяет на уникальности Гос номера
function checkUniqNumber($pdo, $number, $id = '') {
    $output = [];

    if (preg_match('/^[0-9авекмнорстух]{4,6}$/u', $number) == 1) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM car WHERE number = ?");
            $stmt->execute([$number]);

            if ($stmt->fetch()['id'] != $id) {
                $output['result'] = false;
                $output['error'] = 'Авто с таким номером уже существует';
            } else {
                $output['result'] = true;  
            }     
        } catch (Exception $e) {
            $output['result'] = false;
            $output['error'] = $e->getMessage();
        }
    } else {
        $output['result'] = false;
        $output['error'] = 'Недопустимый формат номера';
    }
    
    return $output;
}

// Добавляет нового клиента 
function addNewClient($pdo, $client, $car) {
    $output = [];

    $output = checkUniqPhoneNumber($pdo, $client[1]);
    
    if ($output['result'] == true) {
        $output = checkUniqNumber($pdo, $car[3]);

        if ($output['result'] == true) {
            try {
                $stmt = $pdo->prepare("INSERT INTO client 
                    SET full_name = ?, phone_number = ?, address = ?, gender = ?
                ");
                $stmt->execute(
                    array(
                        htmlspecialchars($client[0]), 
                        htmlspecialchars($client[1]), 
                        htmlspecialchars($client[2]), 
                        htmlspecialchars($client[3])
                    )
                );
            } catch (Exception $e) {
                $output['result'] = false;
                $output['error'] = $e->getMessage();

                return $output;
            }
        } else {
            return $output;
        }
    } else {
        return $output;
    }
    
    return addNewCar($pdo, $car, $pdo->lastInsertId());
}

// Добавляет новую машину
function addNewCar($pdo, $car, $clientId) {
    $output = [];

    $output = checkUniqNumber($pdo, $car[3]);

    if ($output['result'] == true) {
        try {
            $stmt = $pdo->prepare("INSERT INTO car
                SET client_id = ?, brand = ?, model = ?, color = ?, number = ?, status = ?
            ");
            $stmt->execute(
                array(
                    $clientId,
                    htmlspecialchars($car[0]), 
                    htmlspecialchars($car[1]), 
                    htmlspecialchars($car[2]), 
                    htmlspecialchars($car[3]),
                    0
                )
            );
            $output['result'] = true;
            $output['client_id'] = $clientId;
            $output['id'] = $pdo->lastInsertId();
        } catch (Exception $e) {
            $output['result'] = false;
            $output['error'] = $e->getMessage();
        }
    } else {
        return $output;
    }

    return $output;
}

// Удаляет машину
function deleteCar($pdo, $carId) {
    $output = [];

    try {
        
        // Получение id клиента
        $stmt = $pdo->prepare("SELECT client_id FROM car WHERE id = ?");
        $stmt->execute([$carId]);
        $clientId = $stmt->fetch()['client_id'];

        // Удаление машины
        $stmt = $pdo->prepare("DELETE FROM car WHERE id = ?");
        $stmt->execute([$carId]);

        // Проверка на наличие у клента других машин
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM car WHERE client_id = ?");
        $stmt->execute([$clientId]);

        // Удалить клиента, если у него более нет машин
        if ($stmt->fetch()['COUNT(*)'] == 0) {
            deleteClient($pdo, $clientId);
            $output['client_status'] = 0;
        } 

        $output['result'] = true;
    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
    }
    
    return $output;
}

// Считает количество машин находящихся на стоянке в данный момент
function countNumberParkedCars($pdo) {
    $output = [];

    try {
        $stmt = $pdo->prepare("SELECT COUNT(status) FROM car WHERE status = ?");
        $stmt->execute([1]);

        $output['result'] = true;
        $output['quantity'] = $stmt->fetch();
    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
    }
    
    return $output;
}

// Получает информацию о клинте и о всех его машинах
function loadClientInformation($pdo, $clientId) {
    $output = [];

    try {
        $stmt = $pdo->prepare("SELECT * FROM client WHERE id = ?");
        $stmt->execute([$clientId]);

        $output['client'] = $stmt->fetch(PDO::FETCH_ASSOC);


        $stmt = $pdo->prepare("SELECT * FROM car WHERE client_id = ?");
        $stmt->execute([$clientId]);

        $output['result'] = true;
        $output['cars'] = $stmt->fetchAll();

    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
    }

    return $output;
}

// Удаляет клиента
function deleteClient($pdo, $clientId) {
    $output = [];

    try {
        $stmt = $pdo->prepare("DELETE FROM client WHERE id = ?");
        $stmt->execute([$clientId]);

        $output['result'] = true;
    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
    }
    
    return $output;
}

// Обновить данные 
function updateData($pdo, $par, $id, $data) {
    $output = [];

    try {
        if ($par == 'client') {
            $output = checkUniqPhoneNumber($pdo, $data[1], $id);

            if ($output['result'] == true) {
                $stmt = $pdo->prepare("UPDATE client 
                    SET full_name = ?, phone_number = ?, address = ?, gender = ?
                    WHERE id = ?;
                ");
                $stmt->execute([
                    htmlspecialchars($data[0]),
                    htmlspecialchars($data[1]),
                    htmlspecialchars($data[2]),
                    htmlspecialchars($data[3]),
                    $id
                ]);
            } else {
                return $output;
            }
        } else {
            $output = checkUniqNumber($pdo, $data[3], $id);

            if ($output['result'] == true) {
                $stmt = $pdo->prepare("UPDATE car 
                    SET brand = ?, model = ?, color = ?, number = ? 
                    WHERE id = ?;
                    ");
                $stmt->execute([
                    htmlspecialchars($data[0]),
                    htmlspecialchars($data[1]),
                    htmlspecialchars($data[2]),
                    htmlspecialchars($data[3]),
                    $id
                ]);
            } else {
                return $output;
            }
        }

        $output['result'] = true;
    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
    }
    
    return $output;
}

// Изменят статус машины (на парковке / отсутствует)
function changeCarParkingStatus($pdo, $carId) {
    $output = [];

    try {
        $stmt = $pdo->prepare("SELECT status FROM car WHERE id = ?;");
        $stmt->execute([$carId]);
        $status = $stmt->fetch()['status'] == 0 ? 1 : 0;

        $stmt = $pdo->prepare("UPDATE car SET status = ? WHERE id = ?;");
        $stmt->execute([$status, $carId]);

        $output['result'] = true;
        $output['status'] = $status;
    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
    }
    
    return $output;
}

// Получает списка всех клиентов 
function loadClientList($pdo) {
    $output = [];

    try {
        $stmt = $pdo->prepare("SELECT id, full_name FROM client");
        $stmt->execute();

        $output['result'] = true;
        $output['list_client'] = $stmt->fetchAll();       
    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
    }
    
    return $output;
}

// Получение списка машин конкретного клиента
function loadCarList($pdo, $clientId) {
    $output = [];

    try {
        $stmt = $pdo->prepare("SELECT id, brand, number, status FROM car WHERE client_id = ?");
        $stmt->execute([$clientId]);

        $output['result'] = true;
        $output['list_car'] = $stmt->fetchAll();       
    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
    }
    
    return $output;
}