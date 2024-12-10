const {v4: uuidv4} = require("uuid");
const {exec} = require("../utils/exec-db");

async function create(req, res) {
    const {nombre, descripcion} = req.body;

    if(!req.session.userId){
        res.status(401).json({
            message: "no autorizado"
        });
        return;
    }

    if (nombre.length == 0 || nombre.length >= 256) {
        res.status(400).json({
            message: 'el nombre debe ser menor de 255 carácteres'
        })
        return;
    }

    if (descripcion.length == 0 || descripcion.length >= 256) {
        res.status(400).json({
            message: 'la descripcion debe ser menor de 256 carácteres'
        })
        return;
    }
    
    try {
        await exec('INSERT INTO recordatorios (id, nombre, descripcion, user_id) VALUES (?,?,?, ?) ', [
                uuidv4(),
                nombre,
                descripcion,
                req.session.userId
            ]
        )
        res.status(200).json({
            message: 'se ha creado la bodega con exito'
        })
    } catch (error) {
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
            (await exec("SELECT * FROM recordatorios WHERE user_id = ?", [
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
        const sId = req.params.id;

        if(!req.session.userId){
            res.status(401).json({
                message: "no autorizado"
            });
            return;
        }

        res.status(200).json(
            (await exec("SELECT * FROM recordatorios WHERE id = ? AND user_id = ?", [sId,
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
    const {nombre, descripcion} = req.body;

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

    if (nombre.length == 0 || nombre.length >= 256) {
        res.status(400).json({
            message: 'el nombre debe ser menor de 255 carácteres'
        })
        return;
    }

    if (descripcion.length == 0 || descripcion.length >= 256) {
        res.status(400).json({
            message: 'la dirección debe ser menor de 256 carácteres'
        })
        return;
    }

    try {
        await exec('UPDATE recordatorios SET nombre = ?, descripcion = ? WHERE id = ? AND user_id = ?', [
                nombre,
                descripcion,
                sId,
                req.session.userId
            ]
        )

        res.status(200).json({
            message: 'se ha actualizado la bodega con exito'
        });
    } catch (error) {
        res.status(500).json({
            message: 'ha ocurrido un error interno porfavor intentelo más tarde'
        });
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
        await exec('DELETE FROM recordatorios WHERE id = ? AND user_id = ?', [
                sId,
                req.session.userId
            ]
        )
        
        res.status(200).json({
            message: 'se ha eliminado la bodega con exito'
        });
    } catch (error) {
        res.status(500).json({
            message: 'La bodega ya se encuentra en uso'
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