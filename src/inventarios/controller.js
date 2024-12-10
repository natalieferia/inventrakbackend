const {v4: uuidv4} = require("uuid");
const {exec} = require("../utils/exec-db");

async function create(req, res) {
    const {nombre} = req.body;

    if(!req.session.userId){
        res.status(401).json({
            message: "no autorizado"
        });
        return;
    }

    if (nombre.length == 0 || nombre.length >= 256) {
        res.status(400).json({
            message: 'el nombre debe ser menor de 256 carácteres'
        })
        return;
    }
    try {
        await exec('INSERT INTO inventarios (id, nombre, user_id) VALUES (?,?, ?) ', [
                uuidv4(),
                nombre,
                req.session.userId
            ]
        )
        res.status(200).json({
            message: 'se ha creado el inventario con exito'
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
            (await exec("SELECT * FROM inventarios WHERE user_id = ?" , [
                req.session.userId
            ])).result
        )
    } catch (error) {
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        })
    }
}

async function readById(req, res) {
    try {
        if(!req.session.userId){
            res.status(401).json({
                message: "no autorizado"
            });
            return;
        }

        const sId = req.params.id;

        res.status(200).json(
            (await exec("SELECT * FROM inventarios WHERE id = ? AND user_id = ? ", [sId,
                req.session.userId])).result
        )
    } catch (error) {
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

    if (sId.length != 36) {
        res.status(400).json({
            message: 'el id debe ser de 36 carácteres'
        })
        return;
    }

    const {nombre} = req.body

    if (nombre.length == 0 || nombre.length >= 256) {
        res.status(400).json({
            message: 'el nombre debe ser menor de 256 carácteres'
        })
        return;
    }

    try {
        await exec('UPDATE inventarios set nombre = ? WHERE id = ? AND user_id = ?', [
                nombre,
                sId,
                req.session.userId
            ]
        )
        res.status(200).json({
            message: 'se ha actualizado el inventario con exito'
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
        await exec('DELETE FROM inventarios WHERE id = ? AND user_id = ?', [
                sId,
                req.session.userId
            ]
        )
        
        res.status(200).json({
            message: 'se ha eliminado un inventario con exito'
        });
    } catch (error) {
        res.status(500).json({
            message: 'El inventario ya se encuentra en uso'
        });
    }

}

module.exports = {
    create,
    read,
    update,
    deleteById,
    readById
}