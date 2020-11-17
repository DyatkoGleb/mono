<?php

$pdo = connect_db();

function connect_db()
{
    $host = "localhost";
    $login = "root";
    $password = "";
    $dbName = "parking";
    $charset = 'utf8';

    try {
        $dsn = "mysql:host=$host;dbname=$dbName;charset=$charset";
        $opt = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        return new PDO($dsn, $login, $password, $opt);
    } catch (Exception $e) {
        $output['result'] = false;
        $output['error'] = $e->getMessage();
        return $output;
    }
}
