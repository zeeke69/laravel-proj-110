<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('favorites', function (Blueprint $table) {
        $table->string('artifact_id');
        $table->string('source')->default('met');
    });
}

public function down()
{
    Schema::table('favorites', function (Blueprint $table) {
        $table->dropColumn(['artifact_id', 'source']);
    });
}

};
