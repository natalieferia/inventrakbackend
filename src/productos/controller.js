const {v4: uuidv4} = require("uuid");
const {exec} = require("../utils/exec-db");
const ExcelJS = require('exceljs');

async function create(req, res) {
    const {
        nombre,
        codigo,
        cantidad,
        precioDeEntrada,
        precioDeSalida,
        fechaDecaducidad,
        descripcion,
        imagen,
        stock,
        inventarioId
    } = req.body;

    if(!req.session.userId){
        res.status(401).json({
            message: "no autorizado"
        });
        return;
    }

    if (nombre.length == 0 || nombre.length >= 255) {
        res.status(400).json({
            message: 'el nombre debe ser menor de 255 carácteres'
        })
        return;
    }

    if (codigo.length == 0 || codigo.length >= 100) {
        res.status(400).json({
            message: 'el código debe ser menor de 100 carácteres'
        })
        return;
    }

    if (typeof cantidad != 'number') {
        res.status(400).json({
            message: 'en cantidad se deben ingresar numeros'
        })
        return;
    }

    if (typeof precioDeEntrada != 'number') {
        res.status(400).json({
            message: 'en precioDeEntrada se deben ingresar numeros'
        })
        return;
    }

    if (typeof precioDeSalida != 'number') {
        res.status(400).json({
            message: 'en precioDeSalida se deben ingresar numeros'
        })
        return;
    }
    
    if (fechaDecaducidad.length != 10) {
        res.status(400).json({
            message: 'la fecha debe contener maximo 10 caracteres'
        })
        return;
    }

    if (descripcion.length == 0 || descripcion.length >= 255) {
        res.status(400).json({
            message: 'la descripción debe contener maximo 255 caracteres'
        })
        return;
    }

    if (imagen.length == 0 || imagen.length >= 256) {
        res.status(400).json({
            message: 'la url de la imagen debe tener maximo 255 carácteres'
        })
        return;
    }

    if (typeof stock != "boolean") {
        res.status(400).json({
            message: 'el campo stock no es valido'
        })
        return;
    }


    try {
        await exec('INSERT INTO productos (id, nombre, codigo, cantidad, precio_entrada, precio_salida, fecha_caducidad, descripcion, imagen, stock, inventario_id, user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ', [
                uuidv4(),
                nombre,
                codigo,
                cantidad,
                precioDeEntrada,
                precioDeSalida,
                fechaDecaducidad,
                descripcion,
                imagen,
                stock,
                inventarioId,
                req.session.userId


            ]
        )
        res.status(200).json({
            message: 'se ha creado el producto con exito'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }

}

async function read(req, res) {
    try {
        if(!req.session.userId){
            res.status(401).json({
                message: "no autorizado"
            });
            return;
        }

        res.status(200).json(
            (await exec("SELECT * FROM productos WHERE user_id = ?", [
                req.session.userId])).result
        )
    } catch (error) {
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }
}

async function readByInventario(req, res) {
    try {
        const sId = req.params.id;

        if(!req.session.userId){
            res.status(401).json({
                message: "no autorizado"
            });
            return;
        }

        res.status(200).json(
            (await exec("SELECT * FROM productos WHERE inventario_id = ? AND user_id = ?", [sId,
                req.session.userId])).result
        )
    } catch (error) {
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }
}

async function readByReporte(req, res) {
    try {
        if(!req.session.userId){
            res.status(401).json({
                message: "no autorizado"
            });
            return;
        }

        res.status(200).json(
            (await exec("SELECT p.*, i.nombre as inventario FROM productos p INNER JOIN inventarios i ON i.id = p.inventario_id AND p.user_id = ?", [
                req.session.userId
            ])).result
        )
    } catch (error) {
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }
}

async function readMasVendidos(req, res) {
    try {
        if(!req.session.userId){
            res.status(401).json({
                message: "no autorizado"
            });
            return;
        }

        res.status(200).json(
            (await exec("SELECT p.*, i.nombre as inventario FROM productos p INNER JOIN inventarios i ON i.id = p.inventario_id WHERE p.user_id = ? ORDER BY p.ventas DESC", [
                req.session.userId
            ])).result
        )
    } catch (error) {
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }
}

async function updateVenta(req, res) {
    try {
        const sId = req.params.id;

        if(!req.session.userId){
            res.status(401).json({
                message: "no autorizado"
            });
            return;
        }

        res.status(200).json(
            (await exec("UPDATE productos set ventas = ventas + 1 WHERE id = ? AND user_id = ?", [
                sId,
                req.session.userId
            ])).result
        )
    } catch (error) {
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }
}

async function readByAverias(req, res) {
    try {
        if(!req.session.userId){
            res.status(401).json({
                message: "no autorizado"
            });
            return;
        }

        res.status(200).json(
            (await exec("SELECT p.*, i.nombre as inventario FROM productos p INNER JOIN inventarios i ON i.id = p.inventario_id WHERE p.fecha_caducidad <= now() AND p.user_id = ?", [
                req.session.userId
            ])).result
        )
    } catch (error) {
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }
}

async function exportarExcel(req, res) {
    const oWorkbook = new ExcelJS.Workbook();
    const oWorksheet = oWorkbook.addWorksheet('Productos');

    if(!req.session.userId){
        res.status(401).json({
            message: "no autorizado"
        });
        return;
    }

    oWorksheet.columns = [
        {
            header: "ID",
            key: "id",
            width: 10,
        },
        {
            header: "Código",
            key: "codigo",
            width: 10,
        },
        {
            header: "Nombre",
            key: "nombre",
            width: 10,
        },
        {
            header: "Descripción",
            key: "descripcion",
            width: 10,
        },
        {
            header: "Cantidad",
            key: "cantidad",
            width: 10,
        },
        {
            header: "Periodo Entrada",
            key: "precio_entrada",
            width: 10,
        },
        {
            header: "Precio Salida",
            key: "precio_salida",
            width: 10,
        },
        {
            header: "Imagen",
            key: "imagen",
            width: 10,
        },
        {
            header: "Esta en Stock",
            key: "stock",
            width: 10,
        },
        {
            header: "Fecha de Caducidad",
            key: "fecha_caducidad",
            width: 10,
        },
        {
            header: "Inventario",
            key: "nombre_inventario",
            width: 10,
        },
        {
            header: "Fecha Modificación",
            key: "fecha_modificacion",
            width: 10,
        }
    ];

    try {
        const oProductos = await exec("SELECT p.*, i.nombre as nombre_inventario, IF(p.stock = 1, 'Si', 'No') as stock FROM productos p INNER JOIN inventarios i ON i.id = p.inventario_id WHERE user_id = ?", [
                req.session.userId
        ]);

        for (let i = 0; i < oProductos.result.length; i++) {
            oWorksheet.addRow(oProductos.result[i]);
        }
    } catch (oError) {
        console.log(oError)
    } finally {
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="Informe-Productos${new Date().getTime()}.xlsx"`,
        });

        res.send(Buffer.from(await oWorkbook.xlsx.writeBuffer()));
    }
}

async function importarExcel(req, res) {
    if (!req.file) {
        return res.status(400).send({
            message: 'No se ha subido ningún archivo'
        });
    }

    if(!req.session.userId){
        res.status(401).json({
            message: "no autorizado"
        });
        return;
    }

    const oFileBuffer = req.file.buffer;

    const oWorkbook = new ExcelJS.Workbook();
    await oWorkbook.xlsx.load(oFileBuffer);
    const oWorksheet = oWorkbook.getWorksheet("Productos");

    const oRows = oWorksheet.getRows(2, oWorksheet.rowCount - 1);

    try {
        const oInventarios = await exec("SELECT * FROM inventarios WHERE user_id = ?",[
            req.session.userId
        ]);

        const oValuesInsert = oRows.map((oRow) => {
            const oNewValues = oRow.values.slice(1, oRow.values.length -1);

            const oInventario = oInventarios.result.find((oItem) => {
                return oItem.nombre.toUpperCase() === oNewValues[10].toUpperCase()
            })

            if(!oInventario){
                return null;
            } else {
                oNewValues[10] = oInventario.id;
            }

            oNewValues[8] = oNewValues[8].toUpperCase() === "SI" ? 1 : 0;

            if(!oNewValues[0]){
                oNewValues[0] = uuidv4();

                return exec("INSERT INTO productos (id, codigo, nombre, descripcion, cantidad, precio_entrada, precio_salida, imagen, stock, fecha_caducidad, inventario_id, user_id) values (?,?,?,?,?,?,?,?,?,?,?,?)", [...oNewValues,
                    req.session.userId]);
            } else {
                return exec("UPDATE productos set codigo = ?, nombre = ?, descripcion = ?, cantidad = ?, precio_entrada = ?, precio_salida = ?, imagen = ?, stock = ?, fecha_caducidad = ?, inventario_id = ? WHERE id = ? AND user_id = ?", [
                    ...(oNewValues.slice(1, oNewValues.length)),
                    oNewValues[0],
                    req.session.userId
                ]);
            }
        });

        await Promise.all(oValuesInsert)

        //await exec("INSERT INTO productos (id, codigo, nombre, descripcion, cantidad, precio_entrada, precio_salida, imagen, stock, fecha_caducidad, inventario_id) values (?,?,?,?,?,?,?,?,?,?,?)", oValuesInsert);

        res.status(200).json({
            message: "Se ha actualizado los productos de forma exitosa"
        })
    } catch (oError) {
        console.log(oError)

        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }
}

async function update(req, res) {
    const sId = req.params.id;

    if(!req.session.userId){
        res.status(401).json({
            message: "no autorizado"
        });
        return;
    }

    const {
        nombre,
        codigo,
        cantidad,
        precioDeEntrada,
        precioDeSalida,
        fechaDecaducidad,
        descripcion,
        imagen,
        stock,
        inventarioId
    } = req.body

    if (sId.length != 36) {
        res.status(400).json({
            message: 'el id debe ser de 36 carácteres'
        })
        return;
    }

    if (nombre.length == 0 || nombre.length >= 255) {
        res.status(400).json({
            message: 'el nombre debe ser menor de 255 carácteres'
        })
        return;
    }

    if (codigo.length == 0 || codigo.length >= 100) {
        res.status(400).json({
            message: 'el código debe ser menor de 100 carácteres'
        })
        return;
    }

    if (typeof cantidad != 'number') {
        res.status(400).json({
            message: 'en cantidad se deben ingresar numeros'
        })
        return;
    }

    if (typeof precioDeEntrada != 'number') {
        res.status(400).json({
            message: 'en precioDeEntrada se deben ingresar numeros'
        })
        return;
    }

    if (typeof precioDeSalida != 'number') {
        res.status(400).json({
            message: 'en precioDeSalida se deben ingresar numeros'
        })
        return;
    }

    if (fechaDecaducidad.length != 10) {
        res.status(400).json({
            message: 'la fecha debe contener maximo 10 caracteres'
        })
        return;
    }

    if (descripcion.length == 0 || descripcion.length >= 255) {
        res.status(400).json({
            message: 'la descripción debe contener maximo 255 caracteres'
        })
        return;
    }

    if (imagen.length == 0 || imagen.length >= 256) {
        res.status(400).json({
            message: 'la url de la imagen debe tener maximo 255 carácteres'
        })
        return;
    }

    if (typeof stock != "boolean") {
        res.status(400).json({
            message: 'el campo stock no es valido'
        })
        return;
    }


    try {
        await exec('UPDATE productos nombre = ?, codigo = ?, cantidad = ?, precio_entrada = ?, precio_salida = ?, fecha_caducidad = ?, descripcion = ?, imagen = ?, stock = ?, inventario_id = ? WHERE id = ? AND user_id = ?', [
                nombre,
                codigo,
                cantidad,
                precioDeEntrada,
                precioDeSalida,
                fechaDecaducidad,
                descripcion,
                imagen,
                stock,
                inventarioId,
                sId,
                req.session.userId
            ]
        )
        res.status(200).json({
            message: 'se ha actualizado el producto con exito'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }

}

async function deleteById(req, res) {
    const sId = req.params.id;

    if(!req.session.userId){
        res.status(401).json({
            message: "no autorizado"
        });
        return;
    }

    if (sId.length != 36) {
        res.status(400).json({
            message: 'el id debe ser de 36 carácteres'
        })
        return;
    }

    try {
        await exec('DELETE FROM productos WHERE id = ? AND user_id = ?', [
                sId,
                req.session.userId
            ]
        )
        
        res.status(200).json({
            message: 'se ha eliminado el producto con exito'
        });
    } catch (error) {
        res.status(500).json({
            message: 'El producto ya se encuentra en uso'
        });
    }

}

module.exports = {
    create,
    read,
    exportarExcel,
    importarExcel,
    update,
    deleteById,
    readByInventario,
    readByReporte,
    readByAverias,
    readMasVendidos,
    updateVenta
}