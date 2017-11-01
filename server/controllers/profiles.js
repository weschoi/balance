const models = require('../../db/models');

module.exports.getAll = (req, res) => {
  console.log(req.query);
  if (JSON.stringify(req.query) === JSON.stringify({})) {
    models.Profile.fetchAll()
      .then(profiles => {
        res.status(200).send(profiles);
      })
      .catch(err => {
        res.status(503).send(err);
      });
  } else if (req.query.hasOwnProperty('sortBy')) {
    models.Profile.forge().orderBy(req.query.sortBy, 'DESC').query((qb) => {
      qb.limit(Number(req.query.limit) || null);
    }).fetchAll()
      .then(profiles => {
        res.status(200).send(profiles);
      })
      .catch(err => {
        res.status(503).send(err);
      });
  } else if (req.query.hasOwnProperty('properties')) {
    let props = req.query.properties.split(',');
    models.Profile.fetchAll({
      columns: props
    })
      .then(profiles => {
        res.status(200).send(profiles);
      })
      .catch(err => {
        res.status(503).send(err);
      });
  }
};

module.exports.getOne = (req, res) => {
  models.Profile.where({ id: req.params.id }).fetch()
    .then(profile => {
      if (!profile) {
        throw profile;
      }
      res.status(200).send(profile);
    })
    .error(err => {
      res.status(500).send(err);
    })
    .catch(() => {
      res.sendStatus(404);
    });
};

module.exports.update = (req, res) => {
  models.Profile.where({ id: req.params.id }).fetch()
    .then(profile => {
      if (!profile) {
        throw profile;
      }
      return profile.save(req.body, { method: 'update' });
    })
    .then(() => {
      res.sendStatus(200);
    })
    .error(err => {
      res.status(500).send(err);
    })
    .catch(() => {
      res.sendStatus(404);
    });
};