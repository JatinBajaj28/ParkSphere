/*
  Oracle-style PL/SQL supplement for DBMS project documentation.
  The running Node app uses SQLite, while this file demonstrates
  stored-program logic that can be presented separately in the project report/viva.
*/

CREATE OR REPLACE FUNCTION calculate_booking_amount (
  p_price_per_hour IN NUMBER,
  p_start_time IN TIMESTAMP,
  p_end_time IN TIMESTAMP
) RETURN NUMBER
IS
  v_hours NUMBER;
BEGIN
  v_hours := GREATEST((p_end_time - p_start_time) * 24, 1);
  RETURN CEIL(v_hours * p_price_per_hour);
END;
/

CREATE OR REPLACE TRIGGER trg_vehicle_number_upper
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW
BEGIN
  :NEW.vehicle_number := UPPER(:NEW.vehicle_number);
END;
/

CREATE OR REPLACE PROCEDURE create_reservation_with_payment (
  p_reservation_id IN VARCHAR2,
  p_payment_id IN VARCHAR2,
  p_user_id IN VARCHAR2,
  p_parking_area_id IN VARCHAR2,
  p_vehicle_type IN VARCHAR2,
  p_vehicle_number IN VARCHAR2,
  p_start_time IN TIMESTAMP,
  p_end_time IN TIMESTAMP
)
IS
  v_price_per_hour parking_areas.price_per_hour%TYPE;
  v_car_slots parking_areas.car_slots%TYPE;
  v_bike_slots parking_areas.bike_slots%TYPE;
  v_booked_count NUMBER;
  v_amount NUMBER;
  v_capacity NUMBER;
BEGIN
  SELECT price_per_hour, car_slots, bike_slots
  INTO v_price_per_hour, v_car_slots, v_bike_slots
  FROM parking_areas
  WHERE id = p_parking_area_id;

  v_capacity := CASE
    WHEN LOWER(p_vehicle_type) = 'car' THEN v_car_slots
    ELSE v_bike_slots
  END;

  SELECT COUNT(*)
  INTO v_booked_count
  FROM reservations
  WHERE parking_area_id = p_parking_area_id
    AND status = 'confirmed'
    AND vehicle_type = LOWER(p_vehicle_type)
    AND p_start_time < end_time
    AND p_end_time > start_time;

  IF v_booked_count >= v_capacity THEN
    RAISE_APPLICATION_ERROR(-20001, 'No slot available for the selected time range.');
  END IF;

  v_amount := calculate_booking_amount(v_price_per_hour, p_start_time, p_end_time);

  INSERT INTO reservations (
    id,
    user_id,
    parking_area_id,
    vehicle_type,
    vehicle_number,
    start_time,
    end_time,
    duration_hours,
    amount,
    status,
    created_at
  ) VALUES (
    p_reservation_id,
    p_user_id,
    p_parking_area_id,
    LOWER(p_vehicle_type),
    p_vehicle_number,
    p_start_time,
    p_end_time,
    GREATEST((p_end_time - p_start_time) * 24, 1),
    v_amount,
    'confirmed',
    SYSTIMESTAMP
  );

  INSERT INTO payments (
    id,
    reservation_id,
    amount,
    status,
    method,
    payer_name,
    masked_card_number,
    created_at
  ) VALUES (
    p_payment_id,
    p_reservation_id,
    v_amount,
    'paid',
    'card',
    'DBMS Demo User',
    'XXXX-XXXX-XXXX-1234',
    SYSTIMESTAMP
  );
END;
/

CREATE OR REPLACE PROCEDURE owner_monthly_revenue (
  p_owner_id IN VARCHAR2,
  p_result OUT SYS_REFCURSOR
)
IS
BEGIN
  OPEN p_result FOR
    SELECT
      TO_CHAR(r.created_at, 'YYYY-MM') AS revenue_month,
      COUNT(r.id) AS total_bookings,
      SUM(r.amount) AS total_revenue
    FROM parking_areas a
    JOIN reservations r ON r.parking_area_id = a.id
    WHERE a.owner_id = p_owner_id
      AND r.status = 'confirmed'
    GROUP BY TO_CHAR(r.created_at, 'YYYY-MM')
    ORDER BY revenue_month DESC;
END;
/

BEGIN
  DBMS_OUTPUT.PUT_LINE('PL/SQL objects compiled for Parkphere DBMS project.');
END;
/
