#!/bin/bash
# Check taskers and link services
sudo -u postgres psql -d chioi_db <<'EOF'

-- Check tasker users
SELECT user_id, full_name, role FROM users WHERE role = 'TASKER';

-- Check taskers table
SELECT * FROM taskers;

-- Link demo tasker to some services (tasker user_id=3 based on seed)
INSERT INTO tasker_services (tasker_id, service_id, status)
SELECT t.tasker_id, s.service_id, 'APPROVED'
FROM taskers t, services s
WHERE s.service_id IN (1, 2, 3, 4, 7)
ON CONFLICT DO NOTHING;

-- Verify
SELECT ts.tasker_id, s.name, ts.status
FROM tasker_services ts
JOIN services s ON s.service_id = ts.service_id;

EOF
echo "DONE!"
