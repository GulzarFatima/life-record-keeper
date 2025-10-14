export async function createRecord(req, res) {
    try {
      const uid = req.user.uid;         
      const {
        categoryId, title, notes = "",
        startDate = null, endDate = null,
        highlight = false, tags = [], details = {}
      } = req.body;
  
      // validate (no userId in body)
      if (!categoryId || !title?.trim()) {
        return res.status(400).json({ error: "categoryId and title are required" });
      }
  
      const doc = await Record.create({

        //fields
        userId: uid,                     
        categoryId,
        title: title.trim(),
        notes,
        startDate, endDate,
        highlight, tags,
        details,
        documentsCount: 0
      });
  
      res.status(201).json(doc);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
  